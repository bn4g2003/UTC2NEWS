import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    description: 'Username for authentication', 
    example: 'admin' 
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ 
    description: 'User password (minimum 8 characters)', 
    example: 'password123',
    minLength: 8
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
