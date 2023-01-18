import { CreateQuizDto } from '../../dto/create-quiz.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';
import { v4 } from 'uuid';

export class CreateQuestionCommand {
  constructor(public readonly createQuizDto: CreateQuizDto) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionHandler
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(private quizRepo: QuizRepository) {}

  async execute(command: CreateQuestionCommand) {
    const id = v4();
    const mappedQuestions = command.createQuizDto.correctAnswers.map((el) => {
      return { questionId: id, answer: el };
    });
    console.log(mappedQuestions);
    return this.quizRepo.create(
      id,
      command.createQuizDto.body,
      mappedQuestions,
    );
  }
}
