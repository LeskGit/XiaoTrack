import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Exercise } from '../generated/prisma/client';

@Injectable()
export class ExercisesService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    // Step 1.1: the route answers, nothing real yet.
    // Step 1.2: provided exercises (ownerId null) + this user's own, with their note (UserExercise)
    async findAll(userId: string): Promise<Exercise[]> {
        void userId;
        return [];
    }
}
