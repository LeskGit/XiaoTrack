import { Test, TestingModule } from '@nestjs/testing';
import { ExercisesService } from './exercises.service';
import { PrismaService } from '../prisma/prisma.service';

// The generated Prisma client is ESM-only (import.meta): Jest (CommonJS) cannot load it.
// The service only receives PrismaService by injection, so a stand-in class is enough
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('ExercisesService', () => {
  let service: ExercisesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExercisesService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
