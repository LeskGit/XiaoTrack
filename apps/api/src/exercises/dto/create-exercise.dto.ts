import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ExerciseCategory, MeasureType } from '../../generated/prisma/enums';

export class CreateExerciseDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string | null;

  @IsEnum(ExerciseCategory)
  category!: ExerciseCategory;

  @IsEnum(MeasureType)
  measureType!: MeasureType;
}
