import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({ 
    description: 'Array of permission IDs to assign to the role', 
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
