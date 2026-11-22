import { ExerciseCategory, MeasureType } from "../../src/generated/prisma/enums";

/**
 * Exercises provided by the app (ownerId null), shared by every user.
 * `slug` is the stable key the seed upserts on: never change it once seeded.
 * `name` can be renamed freely; the next seed updates it.
 */
export type SeedExercise = {
    readonly slug: string;
    readonly name: string;
    readonly category: ExerciseCategory;
    readonly measureType: MeasureType;
};

const { RESISTANCE, CARDIO } = ExerciseCategory;
const { REPS_WEIGHT, DURATION_DISTANCE } = MeasureType;

export const exercises: ReadonlyArray<SeedExercise> = [
    // Resistance, reps + weight (bodyweight moves log a weight of 0, or the added load)
    // Chest
    { slug: "bench-press", name: "Bench press", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "incline-dumbbell-press", name: "Incline dumbbell press", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "push-up", name: "Push-up", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "dips", name: "Dips", category: RESISTANCE, measureType: REPS_WEIGHT },
    // Back
    { slug: "pull-up", name: "Pull-up", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "lat-pulldown", name: "Lat pulldown", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "barbell-row", name: "Barbell row", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "seated-cable-row", name: "Seated cable row", category: RESISTANCE, measureType: REPS_WEIGHT },
    // Shoulders
    { slug: "overhead-press", name: "Overhead press", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "lateral-raise", name: "Lateral raise", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "face-pull", name: "Face pull", category: RESISTANCE, measureType: REPS_WEIGHT },
    // Arms
    { slug: "biceps-curl", name: "Biceps curl", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "hammer-curl", name: "Hammer curl", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "triceps-pushdown", name: "Triceps pushdown", category: RESISTANCE, measureType: REPS_WEIGHT },
    // Legs
    { slug: "back-squat", name: "Back squat", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "deadlift", name: "Deadlift", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "romanian-deadlift", name: "Romanian deadlift", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "leg-press", name: "Leg press", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "walking-lunge", name: "Walking lunge", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "leg-curl", name: "Leg curl", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "leg-extension", name: "Leg extension", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "hip-thrust", name: "Hip thrust", category: RESISTANCE, measureType: REPS_WEIGHT },
    { slug: "calf-raise", name: "Calf raise", category: RESISTANCE, measureType: REPS_WEIGHT },

    // Resistance, duration (+ distance when it applies)
    { slug: "plank", name: "Plank", category: RESISTANCE, measureType: DURATION_DISTANCE },
    { slug: "side-plank", name: "Side plank", category: RESISTANCE, measureType: DURATION_DISTANCE },
    { slug: "farmers-walk", name: "Farmer's walk", category: RESISTANCE, measureType: DURATION_DISTANCE },

    // Cardio, duration (+ distance when it applies)
    { slug: "running", name: "Running", category: CARDIO, measureType: DURATION_DISTANCE },
    { slug: "treadmill", name: "Treadmill", category: CARDIO, measureType: DURATION_DISTANCE },
    { slug: "cycling", name: "Cycling", category: CARDIO, measureType: DURATION_DISTANCE },
    { slug: "stationary-bike", name: "Stationary bike", category: CARDIO, measureType: DURATION_DISTANCE },
    { slug: "rowing-machine", name: "Rowing machine", category: CARDIO, measureType: DURATION_DISTANCE },
    { slug: "elliptical", name: "Elliptical", category: CARDIO, measureType: DURATION_DISTANCE },
    { slug: "jump-rope", name: "Jump rope", category: CARDIO, measureType: DURATION_DISTANCE },
];
