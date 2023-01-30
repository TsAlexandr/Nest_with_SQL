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
    const findGame = await this.quizRepo.findUserInPair(query.userId);
    if (findGame.length < 1) throw new ForbiddenException();
    const game = await this.quizRepo.findGameById(query.id, query.userId);
    if (game.length < 1) throw new NotFoundException();
    return game;
  }
}
