import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BanUserCommand } from '../commands/banUser.command';
import { UsersRepository } from '../../sa/users/users.repository';
import { CommentsRepository } from '../../public/comments/comments.repository';
import { PostsRepository } from '../../public/posts/posts.repository';
import { authUserLogin } from '../../../../test/tests.data';

@CommandHandler(BanUserCommand)
export class BanUserHandler implements ICommandHandler<BanUserCommand> {
  constructor(private usersRepository: UsersRepository) {}

  async execute(command: BanUserCommand): Promise<any> {
    const { userId, banUserInfo } = command;
    await this.usersRepository.banUser(userId, banUserInfo);
  }
}
