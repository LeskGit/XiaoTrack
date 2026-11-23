import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

@Module({
  // AuthModule exports JwtModule, which AuthGuard needs. PrismaService comes from the global PrismaModule
  imports: [AuthModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}
