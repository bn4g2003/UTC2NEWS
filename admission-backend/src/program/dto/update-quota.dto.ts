import { IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateQuotaDto {
  @ApiProperty({
    description: 'Number of admission slots',
    example: 60,
    minimum: 1,
    required: false,
  })
  @IsInt()
  @Min(1, { message: 'Quota must be a positive integer' })
  @IsOptional()
  quota?: number;
}
