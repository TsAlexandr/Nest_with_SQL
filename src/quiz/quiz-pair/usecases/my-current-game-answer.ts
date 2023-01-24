import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';

export class MyCurrentGameAnswer {
  constructor(public readonly userId: string, public readonly answer: string) {}
}

@CommandHandler(MyCurrentGameAnswer)
export class MyCurrentGameAnswerHandler
  implements ICommandHandler<MyCurrentGameAnswer>
{
  constructor(private quizRepo: QuizRepository) {}
  async execute(command: MyCurrentGameAnswer): Promise<any> {
    const currentUserGame = await this.quizRepo.getCurrentGame(command);
    const playerProgress = await this.quizRepo.getPlayerProgress(
      command.userId,
      currentUserGame.id,
    );

    /*const correctAnswersForCurrentGameProgress =
      await this.quizRepo.getCorrectAnswers(playerProgress.questionId);

    const status = correctAnswersForCurrentGameProgress.includes(
      command.answer,
    ); //correct answer or not
    const addedAt = new Date();
    const updateCorrectAnswers = await this.quizRepo.updateCorrectAnswers(
      command.userId,
      currentUserGame.id,
      playerProgress.questionId,
      status,
    );
    return {
      questionId: playerProgress.questionId,
      answerStatus: status,
      addedAt: addedAt,
    };*/
  }
}
