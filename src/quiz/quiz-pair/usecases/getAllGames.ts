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
    return this.quizRepo.findAllGames(query.query, query.userId);
  }
}
