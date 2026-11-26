import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ExerciseView } from './exercise-view.type';
import type { Exercise } from '../generated/prisma/client';
import type { CreateExerciseDto } from './dto/create-exercise.dto';

@Injectable()
export class ExercisesService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(userId: string): Promise<ExerciseView[]> {
        const exercises = await this.prisma.exercise.findMany({
            // Never another user's personal exercises
            where: { OR: [{ ownerId: null }, { ownerId: userId }] },
            include: {
            userPreferences: { where: { userId }, select: { notes: true } },
            },
            orderBy: { name: 'asc' },
        });

        return exercises.map(({ userPreferences, ...exercise }) =>
            this.toView(exercise, userId, userPreferences[0]?.notes ?? null),
        );
    }

    async createExercise(userId: string, exerciseDto: CreateExerciseDto): Promise<ExerciseView> {
        const exercise = await this.prisma.exercise.create({
            data: { ...exerciseDto, ownerId: userId },
        });
        return this.toView(exercise, userId, null);
    }

    private toView({ slug, ownerId, ...exercise }: Exercise, userId: string, note: string | null): ExerciseView {
        void slug;
        return { ...exercise, isOwn: ownerId === userId, note };
    }
}
