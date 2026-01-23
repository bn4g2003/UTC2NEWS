import { IsString, IsNotEmpty, IsInt, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Session name',
    example: 'Round 1 - 2024',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Admission year',
    example: 2024,
  })
  @IsInt()
  @IsNotEmpty()
  year: number;

  @ApiProperty({
    description: 'Session start date',
    example: '2024-06-01',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Session end date',
    example: '2024-08-31',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: 'Session status',
    enum: SessionStatus,
    example: SessionStatus.active,
  })
  @IsEnum(SessionStatus)
  @IsNotEmpty()
  status: SessionStatus;
}
