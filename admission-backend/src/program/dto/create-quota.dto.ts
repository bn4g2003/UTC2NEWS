import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QuotaConditionsDto {
  @ApiPropertyOptional({
    description: 'Minimum total score (before priority bonus)',
    example: 18.0,
  })
  @IsOptional()
  minTotalScore?: number;

  @ApiPropertyOptional({
    description: 'Minimum score for each subject',
    example: { math: 5.0, physics: 4.0, chemistry: 4.0 },
  })
  @IsOptional()
  @IsObject()
  minSubjectScores?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Required subjects that must have scores',
    example: ['math', 'physics', 'chemistry'],
  })
  @IsOptional()
  requiredSubjects?: string[];

  @ApiPropertyOptional({
    description: 'Valid subject combinations',
    example: [['math', 'physics', 'chemistry'], ['math', 'physics', 'english']],
  })
  @IsOptional()
  subjectCombinations?: string[][];

  @ApiPropertyOptional({
    description: 'Priority bonus configuration',
    example: { enabled: true, maxBonus: 2.0 },
  })
  @IsOptional()
  @IsObject()
  priorityBonus?: {
    enabled: boolean;
    maxBonus: number;
  };
}

export class CreateQuotaDto {
  @ApiProperty({
    description: 'Admission session ID',
    example: 'uuid-session-id',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Major ID',
    example: 'uuid-major-id',
  })
  @IsString()
  @IsNotEmpty()
  majorId: string;

  @ApiProperty({
    description: 'Admission method',
    example: 'entrance_exam',
    enum: ['entrance_exam', 'high_school_transcript', 'direct_admission'],
  })
  @IsString()
  @IsNotEmpty()
  admissionMethod: string;

  @ApiProperty({
    description: 'Number of admission slots',
    example: 50,
    minimum: 1,
  })
  @IsInt()
  @Min(1, { message: 'Quota must be a positive integer' })
  quota: number;

  @ApiPropertyOptional({
    description: 'Admission conditions and criteria',
    type: QuotaConditionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuotaConditionsDto)
  conditions?: QuotaConditionsDto;
}
