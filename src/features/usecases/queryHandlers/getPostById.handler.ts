import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetPostByIdCommand } from '../queryCommands/getPostById.command';
import { PostsRepository } from '../../public/posts/posts.repository';

@QueryHandler(GetPostByIdCommand)
export class GetPostByIdHandler implements IQueryHandler<GetPostByIdCommand> {
  constructor(private postsRepository: PostsRepository) {}

  async execute(command: GetPostByIdCommand) {
    const { id, userId } = command;
    const post = await this.postsRepository.findPostById(id);
    if (!post) throw new NotFoundException();
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      createdAt: post.createdAt,
      blogId: post.blogId,
      blogName: post.name,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }
}
