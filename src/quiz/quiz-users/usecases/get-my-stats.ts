import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';
import { NotFoundException } from '@nestjs/common';

export class GetMyStats {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetMyStats)
export class GetMyStatsHandler implements IQueryHandler<GetMyStats> {
  constructor(private quizRepo: QuizRepository) {}

  async execute(query: GetMyStats): Promise<any> {
    const scores = await this.quizRepo.findGamesByUserIdForCountingScore(
      query.userId,
    );
    if (scores.length < 1) throw new NotFoundException();
    let win = 0;
    let lose = 0;
    let draw = 0;
    scores.map((el) => {
      if (el.result == 1) {
        win++;
      } else if (el.result == -1) {
        lose++;
      } else if (el.result == 0) {
        draw++;
      }
    });
    return {
      sumScore: +scores[0].sumScore,
      avgScores: +scores[0].avgScores,
      gamesCount: +scores[0].gamesCount,
      winsCount: win,
      lossesCount: lose,
      drawsCount: draw,
    };
  }
}
