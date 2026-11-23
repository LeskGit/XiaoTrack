import { Test, TestingModule } from '@nestjs/testing';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { AuthGuard } from '../auth/auth.guard';

// @nestjs/jwt ships as ESM only and AuthGuard imports it: Jest (CommonJS) cannot load it
jest.mock('@nestjs/jwt', () => ({ JwtService: class {} }));
// The service reaches the generated Prisma client (ESM-only): replaced by a stand-in
jest.mock('./exercises.service', () => ({ ExercisesService: class {} }));

describe('ExercisesController', () => {
  let controller: ExercisesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExercisesController],
      providers: [{ provide: ExercisesService, useValue: {} }],
    })
      // The guard is not under test here: it would need a real JwtService
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ExercisesController>(ExercisesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
