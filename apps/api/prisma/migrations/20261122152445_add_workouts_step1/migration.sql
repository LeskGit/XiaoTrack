-- CreateEnum
CREATE TYPE "exercise_category" AS ENUM ('RESISTANCE', 'CARDIO');

-- CreateEnum
CREATE TYPE "measure_type" AS ENUM ('REPS_WEIGHT', 'DURATION_DISTANCE');

-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'SKIPPED');

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT,
    "owner_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "exercise_category" NOT NULL,
    "measure_type" "measure_type" NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_exercises" (
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "user_exercises_pkey" PRIMARY KEY ("user_id","exercise_id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "status" "session_status" NOT NULL DEFAULT 'PLANNED',
    "scheduled_date" DATE,
    "started_at" TIMESTAMPTZ(3),
    "ended_at" TIMESTAMPTZ(3),
    "feeling" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_session_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "session_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_exercise_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "target_reps_min" INTEGER,
    "target_reps_max" INTEGER,
    "target_weight" DECIMAL(6,2),
    "target_duration" INTEGER,
    "target_distance" INTEGER,
    "actual_reps" INTEGER,
    "actual_weight" DECIMAL(6,2),
    "actual_duration" INTEGER,
    "actual_distance" INTEGER,
    "rpe" INTEGER,
    "notes" TEXT,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "session_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_slug_key" ON "exercises"("slug");

-- CreateIndex
CREATE INDEX "workout_sessions_owner_id_status_idx" ON "workout_sessions"("owner_id", "status");

-- CreateIndex
CREATE INDEX "session_exercises_workout_session_id_position_idx" ON "session_exercises"("workout_session_id", "position");

-- CreateIndex
CREATE INDEX "session_exercises_exercise_id_idx" ON "session_exercises"("exercise_id");

-- CreateIndex
CREATE INDEX "session_sets_session_exercise_id_position_idx" ON "session_sets"("session_exercise_id", "position");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_exercises" ADD CONSTRAINT "user_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_exercises" ADD CONSTRAINT "user_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_workout_session_id_fkey" FOREIGN KEY ("workout_session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_session_exercise_id_fkey" FOREIGN KEY ("session_exercise_id") REFERENCES "session_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
