import { QueryDto } from './dto/query.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizAnswersEntity } from './entities/quiz.answers.entity';
import { QuizQuestionsEntity } from './entities/quiz.questions.entity';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizGameEntity } from './entities/quiz-game.entity';
import { PairQueryDto } from './quiz-pair/dto/pair-query.dto';
//vercel error
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
    const questions = await this.dataSource.manager.find(QuizQuestionsEntity, {
      take: 5,
      where: { published: true },
      order: { createdAt: 'DESC' },
    });
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
    return this.dataSource.query(
      `
    SELECT * FROM public.game
    WHERE (player1 = $1 OR player2 = $1) 
    AND (status != 'Finished')`,
      [userId],
    );
  }

  async getProgress(userId: string, gameId: string) {
    return this.dataSource.query(
      `
    SELECT * FROM public."playerProgress"
    WHERE ("userId" = $1) AND ("gameId" = $2)`,
      [userId, gameId],
    );
  }
  async findUserInPair(userId: string) {
    return this.dataSource.query(
      `
    SELECT g.*,
        (SELECT COUNT(*) as "progress" FROM public."playerProgress" p
          WHERE (p."userId" = $1) 
            AND (p."gameId" = g.id)) as "progress"
    FROM public.game g
    WHERE (g.player1 = $1 OR g.player2 = $1) AND (g.status = 'Active')`,
      [userId],
    );
  }

  async findActivePair(userId: string) {
    return this.dataSource.query(
      `
    SELECT g.id, g.status, g."pairCreatedDate", g."startGameDate", g."finishGameDate", 
        (SELECT ROW_TO_JSON(first_progress) FROM
            (SELECT * FROM
                COALESCE((SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(first_answers))) as "answers" 
                    FROM
            (SELECT p."questionId", p."answerStatus", 
            to_char (p."addedAt" ::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "addedAt"
               FROM public."playerProgress" p
                WHERE p."userId" = g.player1 AND p."gameId" = g.id
                ORDER BY p."addedAt" ASC)first_answers), '[]') as "answers",
                 (SELECT ROW_TO_JSON(first_player) as "player" FROM
                    (SELECT u.id, u.login FROM public.users u 
                WHERE u.id = g.player1)first_player) as "player",
                COALESCE((SELECT SUM(p.score) as "score" FROM public."playerProgress" p
                WHERE p."userId" = g.player1 AND p."gameId" = g.id), 0) as "score"
            ) first_progress ) as "firstPlayerProgress", 
        (SELECT ROW_TO_JSON(second_progress) FROM
            (SELECT * FROM
                COALESCE((SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(second_answers))) as "answers" 
                    FROM
            (SELECT p."questionId", p."answerStatus", 
            to_char (p."addedAt" ::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "addedAt" 
               FROM public."playerProgress" p
                WHERE p."userId" = g.player2 AND p."gameId" = g.id
                ORDER BY p."addedAt" ASC)second_answers), '[]') as "answers",
                 (SELECT ROW_TO_JSON(second_player) as "player" FROM
                    (SELECT u.id, u.login FROM public.users u 
                WHERE u.id = g.player2)second_player) as "player",
                COALESCE((SELECT SUM(p.score) as "score" FROM public."playerProgress" p
                WHERE p."userId" = g.player2 AND p."gameId" = g.id), 0) as "score"
            ) second_progress ) as "secondPlayerProgress",
            COALESCE((SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(questions))) as "questions" 
                    FROM
            (SELECT q.id, q.body
                FROM public.questions q
                LEFT JOIN public.game_questions_questions gq
                ON q.id = gq."questionsId"
                WHERE gq."gameId" = g.id)questions), 'null') as "questions"
    FROM public.game g
    WHERE (g.player1 = $1 OR g.player2 = $1) AND (g.status != 'Finished')`,
      [userId],
    );
  }

  async findGameById(id: string, userId: string) {
    return this.dataSource.query(
      `
    SELECT g.id, g.status, g."pairCreatedDate", g."startGameDate", g."finishGameDate", 
        (SELECT ROW_TO_JSON(first_progress) FROM
            (SELECT * FROM
                COALESCE((SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(first_answers))) as "answers" 
                    FROM
            (SELECT p."questionId", p."answerStatus", 
            to_char (p."addedAt" ::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "addedAt"
               FROM public."playerProgress" p
                WHERE p."userId" = g.player1 AND p."gameId" = g.id
                ORDER BY p."addedAt" ASC)first_answers), '[]') as "answers",
                 (SELECT ROW_TO_JSON(first_player) as "player" FROM
                    (SELECT u.id, u.login FROM public.users u 
                WHERE u.id = g.player1)first_player) as "player",
                COALESCE((SELECT SUM(p.score) as "score" FROM public."playerProgress" p
                WHERE p."userId" = g.player1 AND p."gameId" = g.id), 0) as "score"
            ) first_progress ) as "firstPlayerProgress", 
        (SELECT ROW_TO_JSON(second_progress) FROM
            (SELECT * FROM
                COALESCE((SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(second_answers))) as "answers" 
                    FROM
            (SELECT p."questionId", p."answerStatus", 
            to_char (p."addedAt" ::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "addedAt" 
               FROM public."playerProgress" p
                WHERE p."userId" = g.player2 AND p."gameId" = g.id
                ORDER BY p."addedAt" ASC)second_answers), '[]') as "answers",
                 (SELECT ROW_TO_JSON(second_player) as "player" FROM
                    (SELECT u.id, u.login FROM public.users u 
                WHERE u.id = g.player2)second_player) as "player",
                COALESCE((SELECT SUM(p.score) as "score" FROM public."playerProgress" p
                WHERE p."userId" = g.player2 AND p."gameId" = g.id), 0) as "score"
            ) second_progress ) as "secondPlayerProgress",
            COALESCE((SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(questions))) as "questions" 
                    FROM
            (SELECT q.id, q.body
                FROM public.questions q
                LEFT JOIN public.game_questions_questions gq
                ON q.id = gq."questionsId"
                WHERE gq."gameId" = g.id)questions), 'null') as "questions"
    FROM public.game g
    WHERE (g.player1 = $1 OR g.player2 = $1) AND (g.id = $2)`,
      [userId, id],
    );
  }

  async getQuestionsForCurrentGame(id: string) {
    return this.dataSource.query(
      `
    SELECT * FROM public.game g
    LEFT JOIN public.game_questions_questions p
    ON p."gameId" = $1
    LEFT JOIN public.questions q
    ON p."questionsId" = q.id
    LEFT JOIN public.answers a
    ON p."questionsId" = a."questionId"
    WHERE g.id = $1
    ORDER BY q."createdAt" DESC
    `,
      [id],
    );
  }

  async addPlayerProgress(
    userId: string,
    gameId: string,
    questionId: string,
    answer: string,
    score: number,
    date: Date,
    length: number,
  ) {
    const createPlayerProgress = await this.dataSource.query(
      `
            INSERT INTO public."playerProgress"
            ("userId", "gameId", "answerStatus", "addedAt", score, "questionId")
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING "questionId", "answerStatus", "addedAt"`,
      [userId, gameId, answer, date, score, questionId],
    );
    if (length >= 4) {
      const checkProgress = await this.dataSource.query(
        `
      SELECT *,
       (SELECT COUNT(*) FROM public."playerProgress" p
       WHERE p."gameId" = g.id AND p."userId" = g.player1) as "player1ProgressCount",
       (SELECT COUNT(*) FROM public."playerProgress" p
       WHERE p."gameId" = g.id AND p."userId" = g.player2) as "player2ProgressCount"
       FROM public.game g
       WHERE g.id = $1
      `,
        [gameId],
      );
      if (
        checkProgress[0].player1ProgressCount == 5 &&
        checkProgress[0].player2ProgressCount == 5
      ) {
        const finishDate = new Date();
        await this.dataSource.query(
          `
        UPDATE public.game
        SET status = 'Finished', "finishGameDate" = $1
        WHERE id = $2`,
          [finishDate, gameId],
        );
      }
    }
    return {
      questionId: createPlayerProgress[0].questionId,
      answerStatus: createPlayerProgress[0].answerStatus,
      addedAt: createPlayerProgress[0].addedAt,
    };
  }

  async findGame(id: string) {
    return this.dataSource.query(
      `
    SELECT * FROM public.game
    WHERE id = $1`,
      [id],
    );
  }

  async findAllGames(query: PairQueryDto, userId: string) {
    const dynamicSort = `g."${query.sortBy}"`;
    const games = await this.dataSource.query(
      `
    SELECT g.id, g.status, g."pairCreatedDate", g."startGameDate", g."finishGameDate", 
        (SELECT ROW_TO_JSON(first_progress) FROM
            (SELECT * FROM
                COALESCE((SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(first_answers))) as "answers" 
                    FROM
            (SELECT p."questionId", p."answerStatus", 
            to_char (p."addedAt" ::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "addedAt"
               FROM public."playerProgress" p
                WHERE p."userId" = g.player1 AND p."gameId" = g.id
                ORDER BY p."addedAt" ASC)first_answers), '[]') as "answers",
                 (SELECT ROW_TO_JSON(first_player) as "player" FROM
                    (SELECT u.id, u.login FROM public.users u 
                WHERE u.id = g.player1)first_player) as "player",
                COALESCE((SELECT SUM(p.score) as "score" FROM public."playerProgress" p
                WHERE p."userId" = g.player1 AND p."gameId" = g.id), 0) as "score"
            ) first_progress ) as "firstPlayerProgress", 
        (SELECT ROW_TO_JSON(second_progress) FROM
            (SELECT * FROM
                COALESCE((SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(second_answers))) as "answers" 
                    FROM
            (SELECT p."questionId", p."answerStatus", 
            to_char (p."addedAt" ::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "addedAt" 
               FROM public."playerProgress" p
                WHERE p."userId" = g.player2 AND p."gameId" = g.id
                ORDER BY p."addedAt" ASC)second_answers), '[]') as "answers",
                 (SELECT ROW_TO_JSON(second_player) as "player" FROM
                    (SELECT u.id, u.login FROM public.users u 
                WHERE u.id = g.player2)second_player) as "player",
                COALESCE((SELECT SUM(p.score) as "score" FROM public."playerProgress" p
                WHERE p."userId" = g.player2 AND p."gameId" = g.id), 0) as "score"
            ) second_progress ) as "secondPlayerProgress",
            COALESCE((SELECT ARRAY_TO_JSON(ARRAY_AGG(ROW_TO_JSON(questions))) as "questions" 
                    FROM
            (SELECT q.id, q.body
                FROM public.questions q
                LEFT JOIN public.game_questions_questions gq
                ON q.id = gq."questionsId"
                WHERE gq."gameId" = g.id)questions), 'null') as "questions"
    FROM public.game g
    WHERE (g.player1 = $1 OR g.player2 = $1)
    ORDER BY ${dynamicSort} ${query.sortDirection}
    OFFSET $2 ROWS FETCH NEXT $3 ROWS ONLY`,
      [userId, query.skip, query.pageSize],
    );
    const count = await this.dataSource.query(
      `
    SELECT COUNT(*) FROM public.game g
    WHERE (g.player1 = $1 OR g.player2 = $1)
    `,
      [userId],
    );
    const total = Math.ceil(count[0].count / query.pageSize);
    return {
      pagesCount: total,
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: +count[0].count,
      items: games,
    };
  }
}
