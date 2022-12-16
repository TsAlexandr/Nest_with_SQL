import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BanUserCommand } from '../commands/banUser.command';
import { UsersRepository } from '../../sa/users/users.repository';
import { CommentsRepository } from '../../public/comments/comments.repository';
import { PostsRepository } from '../../public/posts/posts.repository';

@CommandHandler(BanUserCommand)
export class BanUserHandler implements ICommandHandler<BanUserCommand> {
  constructor(
    private usersRepository: UsersRepository,
    private commentsRepository: CommentsRepository,
    private postsRepository: PostsRepository,
  ) {}

  async execute(command: BanUserCommand): Promise<any> {
    const { userId, banUserInfo } = command;

    await this.usersRepository.banUser(userId, banUserInfo);
    if (banUserInfo.isBanned === true) {
      await this.commentsRepository.updateCommentWithBanInfo(
        userId,
        banUserInfo.isBanned,
      );
      await this.postsRepository.updatePostWithBanInfo(
        userId,
        banUserInfo.isBanned,
      );
    } else {
      await this.commentsRepository.updateCommentWithBanInfo(
        userId,
        banUserInfo.isBanned,
      );
      await this.postsRepository.updatePostWithBanInfo(
        userId,
        banUserInfo.isBanned,
      );
    }
  }
}
