import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SubjectScoresDto {
  [subject: string]: number;
}

export class UpdatePreferenceDto {
  @ApiProperty({
    description: 'Major code',
    example: 'EE',
    required: false,
  })
  @IsString()
  @IsOptional()
  majorCode?: string;

  @ApiProperty({
    description: 'Admission method',
    example: 'high_school_transcript',
    enum: ['entrance_exam', 'high_school_transcript', 'direct_admission'],
    required: false,
  })
  @IsString()
  @IsOptional()
  admissionMethod?: string;

  @ApiProperty({
    description: 'Preference priority',
    example: 2,
    minimum: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  preferencePriority?: number;

  @ApiProperty({
    description: 'Subject scores',
    example: { math: 9.0, physics: 8.5, chemistry: 9.0 },
    required: false,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => SubjectScoresDto)
  @IsOptional()
  subjectScores?: SubjectScoresDto;
}
