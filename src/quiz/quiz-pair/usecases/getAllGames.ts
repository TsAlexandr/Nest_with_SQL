import { PairQueryDto } from '../dto/pair-query.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';

export class GetAllGames {
  constructor(
    public readonly query: PairQueryDto,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetAllGames)
export class GetAllGamesHandler implements IQueryHandler<GetAllGames> {
  constructor(private quizRepo: QuizRepository) {}
  async execute(query: GetAllGames): Promise<any> {
    const games = await this.quizRepo.findAllGames(query.query, query.userId);
    games.items.map((el) => {
      if (el.firstPlayerProgress.answers.length > 4) {
        const answers1 = el.firstPlayerProgress.answers;
        const answers2 = el.secondPlayerProgress.answers;
        if (
          el.status == 'Finished' &&
          answers1[4].addedAt < answers2[4].addedAt &&
          answers1.map((el) => el.answer == 'Correct').length > 0
        ) {
          el.firstPlayerProgress.score++;
        } else if (
          el.status == 'Finished' &&
          answers2[4].addedAt < answers1[4].addedAt &&
          answers2.map((el) => el.answer == 'Correct').length > 0
        ) {
          el.secondPlayerProgress.score++;
        }
      }
    });

    return games;
  }
}
