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
    if (userInGame.length > 0) throw new ForbiddenException();
    const game = await this.quizRepo.connectToGame(command.userId);
    const result = await this.quizRepo.findGameById(game.id, command.userId);
    return result[0];
  }
}
