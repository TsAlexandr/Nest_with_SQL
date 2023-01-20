import { CreateQuizDto } from '../../../dto/create-quiz.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../../quiz.repository';
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
    return this.quizRepo.create(command.createQuizDto);
  }
}
