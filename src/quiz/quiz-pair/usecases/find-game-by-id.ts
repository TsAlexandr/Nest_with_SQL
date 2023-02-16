import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class FindGameById {
  constructor(public readonly id: string, public readonly userId: string) {}
}

@QueryHandler(FindGameById)
export class FindGameHandler implements IQueryHandler<FindGameById> {
  constructor(private quizRepo: QuizRepository) {}
  async execute(query: FindGameById): Promise<any> {
    const game = await this.quizRepo.findGame(query.id);
    if (game.length < 1) throw new NotFoundException();
    const p1 = [game[0].player1, game[0].player2];
    if (!p1.includes(query.userId)) {
      throw new ForbiddenException();
    }
    const currentGame = await this.quizRepo.findGameById(
      query.id,
      query.userId,
    );
    if (
      currentGame[0].status == 'Finished' &&
      currentGame[0].firstPlayerProgress.answers.length > 4
    ) {
      const answers1 = currentGame[0].firstPlayerProgress.answers;
      const answers2 = currentGame[0].secondPlayerProgress.answers;
      if (
        answers1[4].addedAt < answers2[4].addedAt &&
        answers1.map((el) => el.answer == 'Correct').length > 0
      ) {
        currentGame[0].firstPlayerProgress.score++;
        await this.quizRepo.updateScore(
          currentGame[0].firstPlayerProgress.player.id,
          currentGame[0].firstPlayerProgress.answers[4].questionId,
        );
      } else if (
        answers2[4].addedAt < answers1[4].addedAt &&
        answers2.map((el) => el.answer == 'Correct').length > 0
      ) {
        currentGame[0].secondPlayerProgress.score++;
        await this.quizRepo.updateScore(
          currentGame[0].secondPlayerProgress.player.id,
          currentGame[0].secondPlayerProgress.answers[4].questionId,
        );
      }
    }
    return currentGame[0];
  }
}
