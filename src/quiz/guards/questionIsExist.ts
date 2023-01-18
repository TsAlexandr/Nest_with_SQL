import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { QuizRepository } from '../quiz.repository';

@Injectable()
export class QuestionIsExist implements CanActivate {
  constructor(private quizRepo: QuizRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> | null {
    const request: Request = context.switchToHttp().getRequest();
    const post = await this.quizRepo.findOne(request.params.id);
    if (!post)
      throw new NotFoundException({
        message: 'question not found',
        field: 'id',
      });
    return true;
  }
}
