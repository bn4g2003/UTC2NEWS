import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({
    description: 'Student ID card number',
    example: '001234567890',
    minLength: 9,
    maxLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @Length(9, 12)
  idCard: string;

  @ApiProperty({
    description: 'Student full name',
    example: 'Nguyen Van A',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Student date of birth',
    example: '2005-03-15',
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Student email address',
    example: 'nguyenvana@email.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Student phone number',
    example: '0901234567',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Student address',
    example: '123 Le Loi Street, District 1, Ho Chi Minh City',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Priority points (0-3)',
    example: 0.5,
    minimum: 0,
    maximum: 3,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(3)
  priorityPoints?: number;

  @ApiProperty({
    description: 'ID of the admission session',
    example: 'uuid-of-session',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Student scores in JSON format',
    example: { math: 9, physics: 8 },
    required: false,
  })
  @IsOptional()
  scores?: any;

  @ApiProperty({
    description: 'Path to 3x4 photo',
    required: false,
  })
  @IsString()
  @IsOptional()
  photo3x4?: string;

  @ApiProperty({
    description: 'Path to ID card photo',
    required: false,
  })
  @IsString()
  @IsOptional()
  idCardPhoto?: string;

  @ApiProperty({
    description: 'Path to optional PDF document',
    required: false,
  })
  @IsString()
  @IsOptional()
  documentPdf?: string;
}
