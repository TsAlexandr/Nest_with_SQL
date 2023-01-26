import { Injectable } from '@nestjs/common';
import { QuizRepository } from '../quiz.repository';

@Injectable()
export class QuizService {
  constructor(private quizRepo: QuizRepository) {}

  async remove(id: string) {
    return this.quizRepo.removeQuestions(id);
  }

  async inPair(userId: string) {
    return this.quizRepo.findUserInPair(userId);
  }
}
