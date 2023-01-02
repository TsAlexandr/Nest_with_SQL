import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCommentByIdCommand } from '../queryCommands/getCommentById.commmand';
import { CommentsRepository } from '../../public/comments/comments.repository';
import { NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../sa/users/users.repository';

@QueryHandler(GetCommentByIdCommand)
export class GetCommentByIdHandler
  implements IQueryHandler<GetCommentByIdCommand>
{
  constructor(
    private commentsRepository: CommentsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute(query: GetCommentByIdCommand) {
    const { id, userId } = query;
    const comment = await this.commentsRepository.findComment(id);
    const user = await this.usersRepository.findById(comment.userId.toString());
    if (!comment || user.isBanned === true) {
      throw new NotFoundException();
    } else {
      const currentUserStatus = comment.totalActions.find(
        (el) => el.userId === userId && el.isBanned === false,
      );
      const likesCount = comment.totalActions.filter(
        (el) => el.action === 'Like' && el.isBanned === false,
      ).length;
      const dislikesCount = comment.totalActions.filter(
        (el) => el.action === 'Dislike',
      ).length;
      return {
        createdAt: comment.createdAt,
        content: comment.content,
        id: comment.id,
        userId: comment.userId,
        userLogin: comment.userLogin,
        likesInfo: {
          dislikesCount: dislikesCount,
          likesCount: likesCount,
          myStatus: currentUserStatus ? currentUserStatus.action : 'None',
        },
      };
    }
  }
}
