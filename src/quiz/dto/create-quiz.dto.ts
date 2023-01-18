import { IsArray, IsString, Length } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @Length(10, 500)
  body: string;
  @IsArray()
  correctAnswers: Array<string>;
}
