import { IsString, IsOptional, IsBoolean, IsInt, MinLength, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty({
    description: 'FAQ question',
    example: 'What are the admission requirements?',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  question: string;

  @ApiProperty({
    description: 'FAQ answer',
    example: 'The admission requirements include high school diploma, entrance exam scores...',
  })
  @IsString()
  @MinLength(1)
  answer: string;

  @ApiProperty({
    description: 'Display order (lower numbers appear first)',
    example: 1,
    minimum: 0,
    default: 0,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'Whether the FAQ is active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
