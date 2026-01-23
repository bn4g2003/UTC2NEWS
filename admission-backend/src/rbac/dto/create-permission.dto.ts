import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ 
    description: 'Permission name (unique identifier)', 
    example: 'create_major' 
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Permission description', 
    example: 'Allows creating new academic majors',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
}
