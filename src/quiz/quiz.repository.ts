import { QueryDto } from './dto/query.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizAnswersEntity } from './entities/quiz.answers.entity';
import { QuizQuestionsEntity } from './entities/quiz.questions.entity';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizGameEntity } from './entities/quiz-game.entity';

@Injectable()
export class QuizRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
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
    const questions = await this.dataSource.manager.find(QuizQuestionsEntity);
    const gameExist = await this.dataSource
      .getRepository(QuizGameEntity)
      .createQueryBuilder()
      .where('player2 IS NULL')
      .getOne();
    if (gameExist) {
      await this.queryRunner.connect();
      await this.queryRunner.startTransaction();
      try {
        gameExist.status = 'Active';
        gameExist.player2 = userId;
        gameExist.startGameDate = new Date();
        gameExist.questions = questions;
        await this.dataSource.manager.save(gameExist);
        await this.queryRunner.commitTransaction();
        return gameExist;
      } catch (e) {
        console.log(e);
        await this.queryRunner.rollbackTransaction();
      }
    } else {
      await this.queryRunner.connect();
      await this.queryRunner.startTransaction();
      try {
        const createGame = new QuizGameEntity();
        createGame.status = 'PendingSecondPlayer';
        createGame.player1 = userId;
        await this.dataSource.manager.save(createGame);
        await this.queryRunner.commitTransaction();
        return createGame;
      } catch (e) {
        console.log(e);
        await this.queryRunner.rollbackTransaction();
      }
    }
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

  async addPlayerProgress(userId: string, gameId: string, answer: string) {
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    try {
      const isAnswerCorrect = await this.dataSource.query(
        `
    SELECT g.id, a.answer, p."questionsId"
      FROM public.game g
      LEFT JOIN public.game_questions_questions p
      ON g.id = p."gameId"
      LEFT JOIN public."answers" a
      ON p."questionsId" = a."questionId"
      WHERE (g.status = 'Active') 
        AND (g.player1 = $1 OR g.player2 = $1)
          AND (a.answer = $2)`,
        [userId, answer],
      );
      let answerStatus = 'Correct';
      let score = 1;
      if (isAnswerCorrect == []) {
        answerStatus = 'Incorrect';
        score = 0;
      }
      const date = new Date();
      const createPlayerProgress = await this.dataSource.query(
        `
    INSERT INTO public."playerProgress" ("userId", "gameId", "answerStatus", "addedAt", score, "questionId")
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING "questionId", "answerStatus", "addedAt"`,
        [
          userId,
          gameId,
          answerStatus,
          date,
          score,
          isAnswerCorrect[0].questionsId,
        ],
      );
      await this.queryRunner.commitTransaction();
      return {
        questionId: createPlayerProgress[0].questionId,
        answerStatus: createPlayerProgress[0].answerStatus,
        addedAt: createPlayerProgress[0].addedAt,
      };
    } catch (e) {
      console.log(e);
      await this.queryRunner.rollbackTransaction();
    }
  }
  findUserInPair(userId: string) {
    return this.dataSource.manager.find(QuizGameEntity, {
      where: [{ player1: userId }, { player2: userId }, { status: 'Active' }],
    });
  }

  findActivePair(userId: string) {
    return this.dataSource.query(
      `
    SELECT g.id, g.status, g."pairCreatedDate", g."startGameDate", g."finishGameDate", 
        (SELECT ROW_TO_JSON(first_progress) FROM
            (SELECT * FROM
                (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(first_answers))) as "answers" 
                    FROM
            (SELECT p."questionId", p."answerStatus", p."addedAt" 
               FROM public."playerProgress" p
                WHERE p."userId" = g.player1)first_answers) as "answers",
                 (SELECT ROW_TO_JSON(first_player) FROM
                    (SELECT u.id, u.login FROM public.users u 
                WHERE u.id = g.player1)first_player) as "player"
            ) first_progress ) as "firstPlayerProgress",
        (SELECT ROW_TO_JSON(second_progress) FROM
            (SELECT * FROM
                (SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(second_answers))) as "answers" 
                    FROM
            (SELECT p."questionId", p."answerStatus", p."addedAt" 
               FROM public."playerProgress" p
                WHERE p."userId" = g.player2)second_answers) as "answers",
                 (SELECT ROW_TO_JSON(second_player) FROM
                    (SELECT u.id, u.login FROM public.users u 
                WHERE u.id = g.player2)second_player) as "player"
            ) second_progress ) as "secondPlayerProgress"    
    FROM public.game g
    WHERE (g.player1 = $1 OR g.player2 = $1) AND (g.status = 'Active')`,
      [userId],
    );
  }
}
