import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class FindGameById {
  constructor(public readonly id: string, public readonly userId: string) {}
}

@QueryHandler(FindGameById)
export class FindGameHandler implements IQueryHandler<FindGameById> {
  constructor(private quizRepo: QuizRepository) {}
  async execute(query: FindGameById): Promise<any> {
    const game = await this.quizRepo.findGame(query.id);
    if (game.length < 1) throw new NotFoundException();
    const p1 = [game[0].player1, game[0].player2];
    if (!p1.includes(query.userId)) {
      throw new ForbiddenException();
    }
    const currentGame = await this.quizRepo.findGameById(
      query.id,
      query.userId,
    );
    return currentGame[0];
  }
}
