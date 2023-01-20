import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../../quiz.repository';
import { UpdatePublishDto } from '../../../dto/update-quiz.dto';

export class UpdatePublishCommand {
  constructor(
    public readonly id: string,
    public readonly published: UpdatePublishDto,
  ) {}
}

@CommandHandler(UpdatePublishCommand)
export class UpdatePublishHandler
  implements ICommandHandler<UpdatePublishCommand>
{
  constructor(private quizRepo: QuizRepository) {}
  async execute(command: UpdatePublishCommand): Promise<any> {
    return this.quizRepo.updatePublish(command.id, command.published.published);
  }
}
