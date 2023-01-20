import { QueryDto } from '../../../dto/query.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../../quiz.repository';

export class FindAllQuestions {
  constructor(public readonly queryDto: QueryDto) {}
}

@QueryHandler(FindAllQuestions)
export class FindAllQuestionsHandler
  implements IQueryHandler<FindAllQuestions>
{
  constructor(private quizRepo: QuizRepository) {}
  async execute(query: FindAllQuestions) {
    return this.quizRepo.findAll(query.queryDto);
  }
}
