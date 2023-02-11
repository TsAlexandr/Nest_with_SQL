import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';

export class GetMyStats {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetMyStats)
export class GetMyStatsHandler implements IQueryHandler<GetMyStats> {
  constructor(private quizRepo: QuizRepository) {}

  execute(query: GetMyStats): Promise<any> {
    return this.quizRepo.findGamesByUserIdForCountingScore(query.userId);
  }
}
