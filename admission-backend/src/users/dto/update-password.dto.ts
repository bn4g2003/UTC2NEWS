import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ 
    description: 'New password for the user', 
    example: 'NewPassword123',
    minLength: 8
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
