import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';

export class MyCurrentGameAnswer {
  constructor(public readonly userId: string, public readonly answer: string) {}
}

@CommandHandler(MyCurrentGameAnswer)
export class MyCurrentGameAnswerHandler
  implements ICommandHandler<MyCurrentGameAnswer>
{
  constructor(private quizRepo: QuizRepository) {}
  async execute(command: MyCurrentGameAnswer): Promise<any> {
    const currentUserGame = await this.quizRepo.findOneInGame(command.userId);
    return;
  }
}
