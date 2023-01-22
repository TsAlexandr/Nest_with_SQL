import { IsString } from 'class-validator';

export class CreateQuizPairDto {
  @IsString()
  answer: string;
}
