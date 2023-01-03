import { PostsService } from '../posts/posts.service';
import {
  Blogger,
  Paginator,
  PostsCon,
} from '../../../common/types/classes/classes';
import { Pagination } from '../../../common/types/classes/pagination';
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetAllBlogsCommand } from '../../usecases/queryCommands/getAllBlogs.command';
import { GetBlogsByIdCommand } from '../../usecases/queryCommands/getBlogsById.command';

@Controller('blogs')
export class BlogsController {
  constructor(private queryBus: QueryBus, private postsService: PostsService) {}

  @Get()
  async getAllBlogs(@Query() query): Promise<Paginator<Blogger[]>> {
    const { page, pageSize, searchNameTerm, sortBy, sortDirection } =
      Pagination.getPaginationData(query);
    const bloggers = await this.queryBus.execute(
      new GetAllBlogsCommand(
        page,
        pageSize,
        searchNameTerm,
        sortBy,
        sortDirection,
      ),
    );
    if (!bloggers) {
      throw new NotFoundException();
    }
    return bloggers;
  }

  @Get(':id')
  async getBlogs(@Param('id') id: string): Promise<Blogger> {
    const blogger = await this.queryBus.execute(new GetBlogsByIdCommand(id));
    if (!blogger) {
      throw new NotFoundException();
    }
    return blogger;
  }

  @Get(':blogId/posts')
  async getPostsById(
    @Param('blogId') blogId: string,
    @Query() query,
    @Req() req,
  ): Promise<Paginator<PostsCon[]>> {
    const { page, pageSize, sortBy, sortDirection } = Pagination.getData(query);
    const userId = req.user.userId || null;
    const blogger = await this.queryBus.execute(
      new GetBlogsByIdCommand(blogId),
    );
    if (!blogger) throw new NotFoundException();
    return this.postsService.findAll(
      page,
      pageSize,
      userId,
      blogId,
      sortBy,
      sortDirection,
    );
  }
}
