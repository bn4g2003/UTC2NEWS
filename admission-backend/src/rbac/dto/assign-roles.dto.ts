import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRolesDto {
  @ApiProperty({ 
    description: 'Array of role IDs to assign to the user', 
    example: ['uuid-1', 'uuid-2'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];
}
