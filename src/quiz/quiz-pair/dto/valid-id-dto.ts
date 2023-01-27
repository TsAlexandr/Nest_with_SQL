import { IsUUID } from 'class-validator';

export class ValidIdDto {
  @IsUUID()
  id: string;
}
