import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMajorDto {
  @ApiProperty({
    description: 'Unique major code',
    example: 'CS',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Major name',
    example: 'Computer Science',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Subject combinations for admission',
    example: { A00: ['Math', 'Physics', 'Chemistry'], A01: ['Math', 'Physics', 'English'] },
  })
  @IsObject()
  @IsNotEmpty()
  subjectCombinations: Record<string, any>;

  @ApiProperty({
    description: 'Major description',
    example: 'Bachelor of Computer Science program',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the major is active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
