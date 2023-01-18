import { QueryDto } from './dto/query.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizAnswersEntity } from './entities/quiz.answers.entity';
import { QuizQuestionsEntity } from './entities/quiz.questions.entity';

@Injectable()
export class QuizRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findAll(query: QueryDto) {
    return Promise.resolve(undefined);
  }

  async create(
    id: string,
    body: string,
    mappedQuestions: { questionId: string; answer: string }[],
  ) {
    const question = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(QuizQuestionsEntity)
      .values({ id: id, body: body })
      .execute();
    const answers = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(QuizAnswersEntity)
      .values(mappedQuestions)
      .execute();
    return;
  }
}
