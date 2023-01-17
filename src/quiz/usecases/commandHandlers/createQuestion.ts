import { CreateQuizDto } from '../../dto/create-quiz.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';

export class CreateQuestion {
  constructor(public readonly createQuizDto: CreateQuizDto) {}
}

CommandHandler(CreateQuestion);
export class CreateQuestionHandler implements ICommandHandler<CreateQuestion> {
  constructor(private quizRepo: QuizRepository) {}

  async execute(command: CreateQuestion) {
    return this.quizRepo.create(command.createQuizDto);
  }
}
