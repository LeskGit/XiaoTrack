// Sets up XiaoTrack on a machine: checks, .env files, dependencies, database, Prisma.
// Usage: npm run setup (from the repo root). Safe to run again at any time: every step
// is skipped or harmless when it is already done.

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { parseEnv } from "node:util";

// #region Constants

// Repo root, whatever folder the script is launched from
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const API = join(ROOT, "apps", "api");

const ROOT_ENV = join(ROOT, ".env");
const API_ENV = join(API, ".env");

// Must match container_name in docker-compose.yml
const DB_CONTAINER = "xiaotrack-db";
const HEALTH_TIMEOUT_MS = 60_000;
const HEALTH_POLL_MS = 2_000;

// npm and npx are .cmd files on Windows: they only start through a shell
const IS_WINDOWS = process.platform === "win32";

// #endregion

// #region Helpers

/** An expected failure: printed without a stack trace. */
class SetupError extends Error {}

const step = (title) => console.log(`\n=== ${title}`);
const ok = (text) => console.log(`  [OK] ${text}`);
const warn = (text) => console.log(`  [!]  ${text}`);

/**
 * Runs a program and waits for it to end.
 * mode "inherit": its output goes to the terminal. mode "capture": its output is returned.
 */
const run = (command, args, { cwd = ROOT, mode = "inherit" } = {}) => {
  const useShell = IS_WINDOWS && (command === "npm" || command === "npx");
  const options = {
    cwd,
    encoding: "utf8",
    stdio: mode === "inherit" ? "inherit" : "pipe",
  };
  // With a shell, the command is passed as one string (args are constants of this file)
  const result = useShell
    ? spawnSync([command, ...args].join(" "), { ...options, shell: true })
    : spawnSync(command, args, options);

  return {
    started: !result.error, // false: the program could not even be launched
    status: result.status, // exit code, 0 = success
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
};

/** Runs a step that must succeed, and stops the setup otherwise. */
const runOrFail = (command, args, options) => {
  const label = [command, ...args].join(" ");
  const { started, status } = run(command, args, options);
  if (!started || status !== 0) {
    throw new SetupError(`"${label}" failed (exit code ${status ?? "none"}).`);
  }
};

const readEnv = (path) => parseEnv(readFileSync(path, "utf8"));

// #endregion

// #region Steps

/** 1. Docker installed, then Docker running: two different failures, two messages. */
const checkPrerequisites = () => {
  step("1. Prerequisites");

  if (!run("docker", ["--version"], { mode: "capture" }).started) {
    throw new SetupError("Docker is not installed (or not in the PATH).");
  }
  ok("Docker installed");

  if (run("docker", ["info"], { mode: "capture" }).status !== 0) {
    throw new SetupError("Docker is installed but not running: start Docker Desktop, then run the setup again.");
  }
  ok("Docker running");
};

/** 2. Both .env files exist. A missing one is created from its template, then we stop. */
const checkEnvFiles = () => {
  step("2. .env files");

  const created = [];
  for (const path of [ROOT_ENV, API_ENV]) {
    if (existsSync(path)) {
      ok(`${path} found`);
      continue;
    }
    copyFileSync(`${path}.example`, path);
    created.push(path);
  }

  if (created.length > 0) {
    // No secret is invented here: the owner chooses them
    throw new SetupError(
      `Created from the templates, to fill in now:\n${created.map((p) => `    - ${p}`).join("\n")}\n` +
        "  Use the SAME password in POSTGRES_PASSWORD and in DATABASE_URL, then run the setup again.",
    );
  }
};

/** 3. The two files describe the same database: user, name, port, password. */
const checkEnvConsistency = () => {
  step("3. .env consistency");

  const root = readEnv(ROOT_ENV);
  const api = readEnv(API_ENV);

  if (!api.DATABASE_URL) {
    throw new SetupError(`DATABASE_URL is missing in ${API_ENV}.`);
  }
  const url = new URL(api.DATABASE_URL);

  // [label, value in the root .env (Docker), value in DATABASE_URL (Prisma)]
  const pairs = [
    ["user", root.POSTGRES_USER, decodeURIComponent(url.username)],
    ["database", root.POSTGRES_DB, url.pathname.slice(1)],
    ["port", root.POSTGRES_PORT || "5432", url.port || "5432"],
    ["password", root.POSTGRES_PASSWORD, decodeURIComponent(url.password)],
  ];

  // Only the field names are printed, never the values (the password is one of them)
  const mismatches = pairs.filter(([, docker, prisma]) => !docker || docker !== prisma).map(([label]) => label);
  if (mismatches.length > 0) {
    throw new SetupError(
      `The two .env files disagree on: ${mismatches.join(", ")}.\n` +
        `  Compare POSTGRES_* in ${ROOT_ENV} with DATABASE_URL in ${API_ENV}.`,
    );
  }
  ok("user, database, port and password match");

  if (root.POSTGRES_PASSWORD === "change-me") {
    warn("The password is still the template one (change-me). Acceptable on a dev machine only.");
  }
};

/** 4. npm dependencies of every workspace. */
const installDependencies = () => {
  step("4. npm dependencies");
  runOrFail("npm", ["run", "install:all"]);
  ok("dependencies installed");
};

/** 5. Starts the database container, then waits until Postgres accepts connections. */
const startDatabase = async () => {
  step("5. Database container");
  runOrFail("npm", ["run", "db:up"]);

  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  let health = "";
  while (Date.now() < deadline) {
    // The healthcheck of docker-compose.yml (pg_isready) fills this field
    health = run("docker", ["inspect", "--format", "{{.State.Health.Status}}", DB_CONTAINER], {
      mode: "capture",
    }).output.trim();

    if (health === "healthy") {
      ok(`${DB_CONTAINER} is healthy`);
      return;
    }
    await sleep(HEALTH_POLL_MS);
  }

  const logs = run("docker", ["logs", "--tail", "15", DB_CONTAINER], { mode: "capture" }).output;
  throw new SetupError(
    `${DB_CONTAINER} is still "${health || "unknown"}" after ${HEALTH_TIMEOUT_MS / 1000}s. Last logs:\n${logs}`,
  );
};

/**
 * 6. A real connection, before touching anything. The files can match while the database
 * disagrees: POSTGRES_PASSWORD is only read when the volume is created.
 */
const checkConnection = () => {
  step("6. Database connection");

  // migrate status exits with 1 when migrations are pending: its exit code is not enough,
  // the Prisma error code in the output tells a pending migration from a refused connection
  const { output } = run("npx", ["prisma", "migrate", "status"], { cwd: API, mode: "capture" });

  if (output.includes("P1000")) {
    throw new SetupError(
      "Postgres refuses the password of DATABASE_URL, although both .env files match.\n" +
        "  Likely cause: the database volume was created earlier with another password,\n" +
        "  and Postgres reads POSTGRES_PASSWORD only on its very first start.\n" +
        "  Fix (empty local database only, this deletes its data): npm run db:down -- -v, then run the setup again.",
    );
  }
  if (output.includes("P1001")) {
    throw new SetupError("Postgres cannot be reached at the address of DATABASE_URL (host or port).");
  }
  if (!output.includes("migrations found")) {
    throw new SetupError(`Unexpected answer from "prisma migrate status":\n${output}`);
  }
  ok("Prisma reaches the database");
};

/** 7. Migrations, generated client, seed data. */
const preparePrisma = () => {
  step("7. Prisma");

  // deploy only replays committed migrations: it never creates one, never resets the database
  runOrFail("npx", ["prisma", "migrate", "deploy"], { cwd: API });
  ok("migrations applied");

  // src/generated/prisma is ignored by git: every machine generates its own client
  runOrFail("npx", ["prisma", "generate"], { cwd: API });
  ok("Prisma client generated");

  // The seed uses upserts: running it again changes nothing
  runOrFail("npx", ["prisma", "db", "seed"], { cwd: API });
  ok("seed data in place");
};

// #endregion

// #region Main

try {
  checkPrerequisites();
  checkEnvFiles();
  checkEnvConsistency();
  installDependencies();
  await startDatabase();
  checkConnection();
  preparePrisma();
  console.log("\nXiaoTrack is ready. Start it with: npm run dev\n");
} catch (error) {
  if (error instanceof SetupError) {
    console.error(`\n[KO] ${error.message}\n`);
  } else {
    // An unexpected bug of this script: the stack trace is useful here
    console.error(error);
  }
  process.exit(1);
}

// #endregion
