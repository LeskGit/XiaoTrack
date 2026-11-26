import type { Exercise } from '../generated/prisma/client';

/**
 * An exercise as the API sends it, seen by one user.
 * Internal columns (slug, ownerId) stay on the server; two values are computed for this user.
 */
export type ExerciseView = Omit<Exercise, 'slug' | 'ownerId'> & {
  isOwn: boolean;
  note: string | null;
};
