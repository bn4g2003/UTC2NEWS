import { IsString } from 'class-validator';

export class RemoveMemberDto {
  @IsString()
  roomId: string;

  @IsString()
  userId: string;
}
