import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ExercisesService } from './exercises.service';

// Every route of this controller needs a logged-in user
@UseGuards(AuthGuard)
@Controller('exercises')
export class ExercisesController {
    constructor(private readonly exercisesService: ExercisesService) {}

    // GET /api/exercises
    @Get()
    findAll(@CurrentUserId() userId: string) {
        return this.exercisesService.findAll(userId);
    }
}
