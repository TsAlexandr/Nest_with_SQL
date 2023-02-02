import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { QuizService } from '../../../../quiz/quiz-questions/quiz.service';
@Injectable()
export class UserInPair implements CanActivate {
  constructor(private quizService: QuizService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> | null {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.userId;
    const user = await this.quizService.inPair(userId);
    if (user.length < 1) throw new ForbiddenException();
    return true;
  }
}
