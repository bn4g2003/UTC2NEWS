import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({ 
    description: 'Whether the user account should be active', 
    example: true
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
