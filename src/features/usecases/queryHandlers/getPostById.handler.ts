import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetPostByIdCommand } from '../queryCommands/getPostById.command';
import { PostsRepository } from '../../public/posts/posts.repository';
import { postMapper } from '../../../common/helpers/helpers';
import { BlogsRepository } from '../../public/blogs/blogs.repository';

@QueryHandler(GetPostByIdCommand)
export class GetPostByIdHandler implements IQueryHandler<GetPostByIdCommand> {
  constructor(
    private postsRepository: PostsRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute(command: GetPostByIdCommand) {
    const { id, userId } = command;
    const post = await this.postsRepository.findPostById(id);
    const blogs = await this.blogsRepository.getBlogForValidation(post.blogId);
    if (!blogs) throw new NotFoundException();
    if (!post) throw new NotFoundException();
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      createdAt: post.createdAt,
      blogId: post.blogId,
      blogName: blogs.name,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }
}
