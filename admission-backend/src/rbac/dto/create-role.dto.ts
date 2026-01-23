import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ 
    description: 'Role name (unique identifier)', 
    example: 'admission_coordinator' 
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Role description', 
    example: 'Manages admission sessions and processes applications',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
}
