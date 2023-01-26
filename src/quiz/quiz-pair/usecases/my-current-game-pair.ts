import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';

export class MyCurrentGamePair {
  constructor(public readonly userId: string) {}
}

@QueryHandler(MyCurrentGamePair)
export class MyCurrentPairHandler implements IQueryHandler<MyCurrentGamePair> {
  constructor(private quizRepo: QuizRepository) {}
  execute(query: MyCurrentGamePair): Promise<any> {
    return this.quizRepo.findActivePair(query.userId);
  }
}
