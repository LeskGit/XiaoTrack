/*
  Warnings:

  - You are about to drop the column `skipped` on the `session_exercises` table. All the data in the column will be lost.
  - You are about to drop the column `target_reps_min` on the `session_sets` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `user_exercises` table. All the data in the column will be lost.
  - Added the required column `rest_seconds` to the `session_exercises` table without a default value. This is not possible if the table is not empty.
  - Added the required column `measure_type` to the `session_sets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `workout_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "session_exercise_status" AS ENUM ('PENDING', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "user_exercise_state" AS ENUM ('NONE', 'FAVORITE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "session_exercises" DROP COLUMN "skipped",
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "rest_seconds" INTEGER NOT NULL,
ADD COLUMN     "status" "session_exercise_status" NOT NULL DEFAULT 'PENDING';

-- AlterTable
-- Edited by hand: Prisma generated DROP "target_reps_min" + ADD "target_reps"; a rename keeps the data
ALTER TABLE "session_sets" RENAME COLUMN "target_reps_min" TO "target_reps";
ALTER TABLE "session_sets" ADD COLUMN     "measure_type" "measure_type" NOT NULL;

-- AlterTable
ALTER TABLE "user_exercises" DROP COLUMN "notes",
ADD COLUMN     "default_rest_seconds" INTEGER,
ADD COLUMN     "state" "user_exercise_state" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "workout_sessions" ADD COLUMN     "title" TEXT NOT NULL;

-- Added by hand (Prisma cannot declare a CHECK constraint)
-- A range needs a low end, and max is strictly greater ("6 to 6" is written "6")
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_target_reps_range_check"
  CHECK ("target_reps_max" IS NULL
         OR ("target_reps" IS NOT NULL AND "target_reps_max" > "target_reps"));

-- Columns that do not belong to the set's measure profile must stay empty.
-- Explicit OR, no CASE: a new measure_type value is rejected until this constraint is updated
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_measure_columns_check"
  CHECK (
    ("measure_type" = 'REPS_WEIGHT'
       AND "target_duration" IS NULL AND "target_distance" IS NULL
       AND "actual_duration" IS NULL AND "actual_distance" IS NULL)
    OR
    ("measure_type" = 'DURATION_DISTANCE'
       AND "target_reps" IS NULL AND "target_reps_max" IS NULL AND "target_weight" IS NULL
       AND "actual_reps" IS NULL AND "actual_weight" IS NULL)
  );
