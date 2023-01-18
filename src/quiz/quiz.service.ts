import { Injectable } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@Injectable()
export class QuizService {
  update(id: string, updateQuizDto: UpdateQuizDto) {
    return `This action updates a #${id} quiz`;
  }

  remove(id: string) {
    return `This action removes a #${id} quiz`;
  }
}
