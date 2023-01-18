import { PartialType } from '@nestjs/mapped-types';
import { CreateQuizDto } from './create-quiz.dto';
import { IsBoolean, IsString } from 'class-validator';

export class UpdateQuizDto extends CreateQuizDto {}

export class UpdatePublishDto {
  @IsBoolean()
  published: boolean;
}
