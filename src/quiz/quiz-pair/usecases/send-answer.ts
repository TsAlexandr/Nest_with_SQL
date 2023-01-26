import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';

export class SendAnswer {
  constructor(public readonly userId: string, public readonly answer: string) {}
}

@CommandHandler(SendAnswer)
export class SendAnswerHandler implements ICommandHandler<SendAnswer> {
  constructor(private quizRepo: QuizRepository) {}
  async execute(command: SendAnswer): Promise<any> {
    const currentUserGame = await this.quizRepo.findUserInPair(command.userId);
    const playerProgress = await this.quizRepo.addPlayerProgress(
      command.userId,
      currentUserGame[0].id,
      command.answer,
    );
    return playerProgress;
  }
}
