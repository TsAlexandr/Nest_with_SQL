import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';
import { ForbiddenException } from '@nestjs/common';

export class ConnectToPairCommand {
  constructor(public readonly userId: string) {}
}

@CommandHandler(ConnectToPairCommand)
export class ConnectToPairHandler
  implements ICommandHandler<ConnectToPairCommand>
{
  constructor(private quizRepo: QuizRepository) {}
  async execute(command: ConnectToPairCommand): Promise<any> {
    const userInGame = await this.quizRepo.findOneInGame(command.userId);
    if (userInGame) throw new ForbiddenException();
    return this.quizRepo.connectToGame(command.userId);
  }
}
