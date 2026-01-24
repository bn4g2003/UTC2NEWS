import { IsString, IsArray, ArrayMinSize } from 'class-validator';

export class AddMemberDto {
  @IsString()
  roomId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one user is required' })
  @IsString({ each: true })
  userIds: string[];
}
