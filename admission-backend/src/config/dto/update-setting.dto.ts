import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({
    description: 'Setting value (can be any type: string, number, boolean, object)',
    example: 'noreply@admission.edu.vn',
  })
  @IsNotEmpty()
  value: any;

  @ApiProperty({
    description: 'Setting description',
    example: 'Email sender address for notifications',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
