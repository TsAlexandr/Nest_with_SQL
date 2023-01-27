import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';
import { NotFoundException } from '@nestjs/common';

export class MyCurrentGamePair {
  constructor(public readonly userId: string) {}
}

@QueryHandler(MyCurrentGamePair)
export class MyCurrentPairHandler implements IQueryHandler<MyCurrentGamePair> {
  constructor(private quizRepo: QuizRepository) {}
  async execute(query: MyCurrentGamePair): Promise<any> {
    const pair = await this.quizRepo.findActivePair(query.userId);
    if (!pair) throw new NotFoundException();
    return pair;
  }
}
