import { UpdateQuizDto } from '../../../dto/update-quiz.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../../quiz.repository';
import { BadRequestException } from '@nestjs/common';

export class UpdateQuestionCommand {
  constructor(
    public readonly id: string,
    public readonly body: UpdateQuizDto,
  ) {}
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionHandler
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(private quizRepo: QuizRepository) {}
  async execute(command: UpdateQuestionCommand): Promise<any> {
    const isPublished = await this.quizRepo.findOne(command.id);
    if (isPublished.published) throw new BadRequestException();
    return this.quizRepo.updateQuestion(command.id, command.body);
  }
}
