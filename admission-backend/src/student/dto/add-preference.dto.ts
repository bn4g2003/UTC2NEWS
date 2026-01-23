import {
  IsString,
  IsNotEmpty,
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

export class AddPreferenceDto {
  @ApiProperty({
    description: 'Admission session ID',
    example: 'uuid-session-id',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Major code',
    example: 'CS',
  })
  @IsString()
  @IsNotEmpty()
  majorCode: string;

  @ApiProperty({
    description: 'Admission method',
    example: 'entrance_exam',
    enum: ['entrance_exam', 'high_school_transcript', 'direct_admission'],
  })
  @IsString()
  @IsNotEmpty()
  admissionMethod: string;

  @ApiProperty({
    description: 'Preference priority (1 = first choice, 2 = second choice, etc.)',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  preferencePriority: number;

  @ApiProperty({
    description: 'Subject scores',
    example: { math: 8.5, physics: 9.0, chemistry: 8.0 },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => SubjectScoresDto)
  subjectScores: SubjectScoresDto;
}
