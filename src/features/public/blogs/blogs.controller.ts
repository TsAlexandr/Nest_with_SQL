import { PostsService } from '../posts/posts.service';
import { Blogger, Paginator } from '../../../common/classes/classes';
import { Pagination } from '../../../common/classes/pagination';
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetAllBlogsCommand } from '../../usecases/queryCommands/getAllBlogs.command';
import { GetBlogsByIdCommand } from '../../usecases/queryCommands/getBlogsById.command';
import { JwtExtract } from '../auth/guards/jwt.extract';

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
  @UseGuards(JwtExtract)
  @Get(':blogId/posts')
  async getPostsById(
    @Param('blogId') blogId: string,
    @Query() query,
    @Req() req,
  ) {
    const { page, pageSize, sortBy, sortDirection } = Pagination.getData(query);
    const userId = req.user?.userId;
    console.log(req.user);
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
