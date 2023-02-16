import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';
import { ForbiddenException } from '@nestjs/common';

export class SendAnswer {
  constructor(public readonly userId: string, public readonly answer: string) {}
}

@CommandHandler(SendAnswer)
export class SendAnswerHandler implements ICommandHandler<SendAnswer> {
  constructor(private quizRepo: QuizRepository) {}
  async execute(command: SendAnswer): Promise<any> {
    const currentUserGame = await this.quizRepo.findUserInPair(command.userId);
    if (currentUserGame.length < 1 || +currentUserGame[0].progress == 5)
      throw new ForbiddenException();
    const questions = await this.quizRepo.getQuestionsForCurrentGame(
      currentUserGame[0].id,
    );
    const playerProgress = await this.quizRepo.getProgress(
      command.userId,
      currentUserGame[0].id,
    );
    const questionId =
      questions[playerProgress.length < 1 ? 0 : playerProgress.length]
        .questionId;
    const status = questions.find((el) => el.questionId === questionId);
    console.log(status.answer, command.answer);
    const answer = status.answer == command.answer ? 'Correct' : 'Incorrect';
    const score = answer == 'Correct' ? 1 : 0;
    const date = new Date();
    const addPlayerProgress = await this.quizRepo.addPlayerProgress(
      command.userId,
      currentUserGame[0].id,
      questionId,
      answer,
      score,
      date,
    );
    if (playerProgress.length >= 4) {
      const checkProgress = await this.quizRepo.checkExistingProgress(
        currentUserGame[0].id,
      );
      if (
        checkProgress[0].player1ProgressCount == 5 &&
        checkProgress[0].player2ProgressCount == 5
      ) {
        await this.quizRepo.finishGame(currentUserGame[0].id);
        const currentGame = await this.quizRepo.findGameById(
          currentUserGame[0].id,
          command.userId,
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
            await this.quizRepo.updateScore(
              currentGame[0].firstPlayerProgress.player.id,
              currentGame[0].firstPlayerProgress.answers[4].questionId,
            );
          } else if (
            answers2[4].addedAt < answers1[4].addedAt &&
            answers2.map((el) => el.answer == 'Correct').length > 0
          ) {
            await this.quizRepo.updateScore(
              currentGame[0].secondPlayerProgress.player.id,
              currentGame[0].secondPlayerProgress.answers[4].questionId,
            );
          }
        }
      }
    }

    return addPlayerProgress;
  }
}
