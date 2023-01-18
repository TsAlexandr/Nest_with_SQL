import { PartialType } from '@nestjs/mapped-types';
import { CreateQuizDto } from './create-quiz.dto';
import { IsString } from 'class-validator';

export class UpdateQuizDto extends CreateQuizDto {}
