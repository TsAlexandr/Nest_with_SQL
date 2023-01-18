import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepository } from '../../quiz.repository';

export class UpdatePublishCommand {
  constructor(public readonly id: string, public readonly published: boolean) {}
}

@CommandHandler(UpdatePublishCommand)
export class UpdatePublishHandler
  implements ICommandHandler<UpdatePublishCommand>
{
  constructor(private quizRepo: QuizRepository) {}
  async execute(command: UpdatePublishCommand): Promise<any> {
    return this.quizRepo.updatePublish(command.id, command.published);
  }
}
