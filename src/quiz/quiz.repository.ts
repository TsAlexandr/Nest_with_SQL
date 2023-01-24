import { QueryDto } from './dto/query.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizAnswersEntity } from './entities/quiz.answers.entity';
import { QuizQuestionsEntity } from './entities/quiz.questions.entity';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizGameEntity } from './entities/quiz-game.entity';
import { PlayerProgressEntity } from './entities/player-progress.entity';
import { MyCurrentGameAnswer } from './quiz-pair/usecases/my-current-game-answer';
import { HelperForProgress } from '../common/helpers/helpers';

@Injectable()
export class QuizRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private helper: HelperForProgress,
  ) {}
  queryRunner = this.dataSource.createQueryRunner();

  async findAll(query: QueryDto) {
    const dynamicSort = `q."${query.sortBy}"`;
    const questions = await this.dataSource.query(
      `
    SELECT q.*, ARRAY(SELECT a.answer FROM public.answers a
          WHERE a."questionId" = q.id) as "correctAnswers"
    FROM public.questions q 
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
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    try {
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
      await this.queryRunner.commitTransaction();
      return {
        id: raw.id,
        body: raw.body,
        correctAnswers: mappedAnswers,
        published: raw.published,
        createdAt: raw.createdAt,
        updatedAt: null,
      };
    } catch (e) {
      console.log(e);
      await this.queryRunner.rollbackTransaction();
    }
  }

  async updateQuestion(id: string, updateQuizDto: UpdateQuizDto) {
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    try {
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
        .where('questionId = :questionId', { questionId: id })
        .execute();

      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into(QuizAnswersEntity)
        .values(mappedQuestions)
        .execute();
      await this.queryRunner.commitTransaction();
    } catch (e) {
      console.log(e);
      await this.queryRunner.rollbackTransaction();
    }
  }

  async updatePublish(id: string, published: boolean) {
    const date = new Date();
    await this.dataSource
      .createQueryBuilder()
      .update(QuizQuestionsEntity)
      .set({ published: published, updatedAt: date })
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

  async connectToGame(userId: string) {
    const questions = await this.dataSource.manager.find(QuizQuestionsEntity, {
      select: ['id', 'body'],
    });
    let createGame;
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    try {
      createGame = await this.dataSource
        .createQueryBuilder()
        .update(QuizGameEntity)
        .set({
          status: 'Active',
          player2: userId,
          startGameDate: new Date(),
        })
        .where('player2 IS NULL')
        .returning('player2')
        .execute();
      await this.helper.saveProgress(questions, userId);
      await this.queryRunner.commitTransaction();
    } catch (e) {
      console.log(e);
      await this.queryRunner.rollbackTransaction();
    }

    if (createGame.affected < 1) {
      await this.queryRunner.connect();
      await this.queryRunner.startTransaction();
      try {
        createGame = new QuizGameEntity();
        createGame.status = 'PendingSecondPlayer';
        createGame.player1 = userId;
        createGame.questions = questions;
        await this.dataSource.manager.save(questions);
        await this.helper.saveProgress(questions, userId);
        await this.queryRunner.commitTransaction();
      } catch (e) {
        console.log(e);
        await this.queryRunner.rollbackTransaction();
      }
    }
    return createGame;
  }

  async findOneInGame(userId: string) {
    const gameStatus = 'Finished';
    return this.dataSource
      .getRepository(QuizGameEntity)
      .createQueryBuilder()
      .where('player1 = :userId OR player2 = :userId', { userId })
      .andWhere('status != :gameStatus', { gameStatus })
      .getOne();
  }

  async getCurrentGame(command: MyCurrentGameAnswer) {
    const gameStatus = 'Active';
    const currentGame = await this.dataSource.query(
      `
      SELECT g.id, g.status, g.player1, g.player2, p."questionId", a.answer
      FROM public.game g
      LEFT JOIN public."playerProgress" p
      ON g.id = p."gameId"
      LEFT JOIN public."answers" a
      ON p."questionId" = a."questionId"
      WHERE (g.status = $1) AND (g.player1 = $2 OR g.player2 = $2)`,
      [gameStatus, command.userId, command.answer],
    );
    console.log(currentGame);
    return currentGame[0];
  }

  async getPlayerProgress(userId: string, gameId: string) {
    return this.dataSource
      .getRepository(PlayerProgressEntity)
      .createQueryBuilder()
      .where('userId = :userId', { userId })
      .andWhere('gameId = :gameId', { gameId })
      .getOne();
  }
}
