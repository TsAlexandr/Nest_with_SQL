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
    console.log(currentUserGame);
    if (currentUserGame.length < 1) throw new ForbiddenException();
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
    const answer = status.answer == command.answer ? 'Correct' : 'Incorrect';
    const score = answer == 'Correct' ? 1 : 0;
    const date = new Date();
    console.log(playerProgress.length);
    const addPlayerProgress = await this.quizRepo.addPlayerProgress(
      command.userId,
      currentUserGame[0].id,
      questionId,
      answer,
      score,
      date,
      playerProgress.length,
    );

    return addPlayerProgress;
  }
}
