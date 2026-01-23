import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
