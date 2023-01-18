import { CreateQuizDto } from './create-quiz.dto';
import { IsBoolean } from 'class-validator';

export class UpdateQuizDto extends CreateQuizDto {}

export class UpdatePublishDto {
  @IsBoolean()
  published: boolean;
}
