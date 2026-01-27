import { IsInt, Min, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QuotaConditionsDto } from './create-quota.dto';

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

  @ApiPropertyOptional({
    description: 'Admission conditions and criteria',
    type: QuotaConditionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuotaConditionsDto)
  conditions?: QuotaConditionsDto;

  @ApiPropertyOptional({
    description: 'Formula ID for this quota',
    example: 'uuid-formula-id',
  })
  @IsOptional()
  formulaId?: string;
}
