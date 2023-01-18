import { QueryDto } from './dto/query.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizAnswersEntity } from './entities/quiz.answers.entity';
import { QuizQuestionsEntity } from './entities/quiz.questions.entity';
import { UpdatePublishDto, UpdateQuizDto } from './dto/update-quiz.dto';

@Injectable()
export class QuizRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findAll(query: QueryDto) {
    const dynamicSort = `q."${query.sortBy}"`;
    const questions = await this.dataSource.query(
      `
    SELECT q.*,
    (SELECT ARRAY_AGG(answers_info) as "correctAnswers"
    FROM (SELECT a2.answer FROM public.answers a2
          WHERE a."questionId" = q.id) answers_info) as "correctAnswers"
    FROM public.questions q
    LEFT JOIN public.answers a
    ON q.id = a."questionId"
    WHERE (q.body ilike $1)
    AND 
    CASE
        WHEN '${query.publishedStatus}' = 'notPublished' 
            THEN q.published = false
        WHEN '${query.publishedStatus}' = 'published' 
            THEN q.published = true
    ELSE q.published IN (true, false)
        END
    ORDER BY ${dynamicSort} ${query.sortDirection}
    OFFSET $2 ROWS FETCH NEXT $3 ROWS ONLY
    `,
      ['%' + query.bodySearchTerm + '%', query.skip, query.pageSize],
    );
    const count = await this.dataSource.query(
      `
    SELECT COUNT(*) FROM public.questions q
    WHERE (q.body ilike $1)
    AND 
    CASE
        WHEN '${query.publishedStatus}' = 'notPublished' 
            THEN q.published = false
        WHEN '${query.publishedStatus}' = 'published' 
            THEN q.published = true
    ELSE q.published IN (true, false)
        END
    `,
      ['%' + query.bodySearchTerm + '%'],
    );
    const total = Math.ceil(count[0].count / query.pageSize);
    return {
      pagesCount: total,
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: +count[0].count,
      items: questions,
    };
  }

  async findOne(id: string) {
    return this.dataSource
      .getRepository(QuizQuestionsEntity)
      .createQueryBuilder()
      .where('id = :id', { id })
      .getOne();
  }

  async create(fields: CreateQuizDto) {
    const question = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(QuizQuestionsEntity)
      .values({ body: fields.body, updatedAt: null })
      .returning(['id', 'body'])
      .execute();
    const raw = question.raw[0];
    const mappedQuestions = fields.correctAnswers.map((el) => {
      return { questionId: raw.id, answer: el };
    });
    const answers = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(QuizAnswersEntity)
      .values(mappedQuestions)
      .returning('answer')
      .execute();
    const mappedAnswers = [];
    answers.raw.forEach((el) => mappedAnswers.push(Object.values(el)[0]));
    return {
      id: raw.id,
      body: raw.body,
      correctAnswers: mappedAnswers,
      published: raw.published,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  async updateQuestion(id: string, updateQuizDto: UpdateQuizDto) {
    const date = new Date();
    await this.dataSource
      .createQueryBuilder()
      .update(QuizQuestionsEntity)
      .set({ body: updateQuizDto.body, updatedAt: date })
      .where('id = :id', { id })
      .execute();

    const mappedQuestions = updateQuizDto.correctAnswers.map((el) => {
      return { questionId: id, answer: el };
    });
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(QuizAnswersEntity)
      .where('id = :questionId', { questionId: id })
      .execute();

    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(QuizAnswersEntity)
      .values(mappedQuestions)
      .execute();
  }

  async updatePublish(id: string, published: boolean) {
    await this.dataSource
      .createQueryBuilder()
      .update(QuizQuestionsEntity)
      .set({ published: published })
      .where('id = :id', { id })
      .execute();
  }

  async removeQuestions(id: string) {
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(QuizQuestionsEntity)
      .where('id = :id', { id })
      .execute();
  }
}
