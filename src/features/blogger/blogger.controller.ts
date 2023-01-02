import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuards } from '../public/auth/guards/jwt-auth.guards';
import {
  Blogger,
  Paginator,
  PostsCon,
} from '../../common/types/classes/classes';
import { BloggersDto } from '../public/blogs/dto/bloggers.dto';
import { BlogsService } from '../public/blogs/blogs.service';
import { PostsService } from '../public/posts/posts.service';
import { Pagination } from '../../common/types/classes/pagination';
import { UsersService } from '../sa/users/users.service';
import { CurrentUserId } from '../../common/custom-decorator/current.user.decorator';
import { QueryBus } from '@nestjs/cqrs';
import { GetAllBloggerCommentsCommand } from '../usecases/queryCommands/getAllBloggerComments.command';
import { NewPost } from '../public/posts/dto/create-post.dto';
import { ExistingPostGuard } from '../public/auth/guards/existingPostGuard';
import { ExistingBlogGuard } from '../public/auth/guards/existingBlog.guard';
import { GetAllBloggersBlogsCommand } from '../usecases/queryCommands/getAllBloggersBlogs.command';

@UseGuards(JwtAuthGuards)
@Controller('blogger/blogs')
export class BloggerController {
  constructor(
    private bloggersService: BlogsService,
    private postsService: PostsService,
    private queryBus: QueryBus,
  ) {}

  @Get()
  async getAllBloggers(
    @Query() query,
    @CurrentUserId() userId: string,
  ): Promise<Paginator<Blogger[]>> {
    const { page, pageSize, searchNameTerm, sortBy, sortDirection } =
      Pagination.getPaginationData(query);
    return this.queryBus.execute(
      new GetAllBloggersBlogsCommand(
        page,
        pageSize,
        searchNameTerm,
        sortBy,
        sortDirection,
        userId,
      ),
    );
  }

  @Get('comments')
  async getAllBloggerComments(
    @Query() query,
    @CurrentUserId() ownerId: string,
  ) {
    const { page, pageSize, sortBy, sortDirection } = Pagination.getData(query);
    return this.queryBus.execute(
      new GetAllBloggerCommentsCommand(
        page,
        pageSize,
        sortBy,
        sortDirection,
        ownerId,
      ),
    );
  }

  @Post()
  async createBlogger(
    @Body() bloggersDto: BloggersDto,
    @CurrentUserId() userId: string,
  ): Promise<Blogger> {
    return this.bloggersService.createBlogger(bloggersDto, userId);
  }

  @UseGuards(ExistingBlogGuard)
  @Post(':blogId/posts')
  async createNewPostForBlogger(
    @Param('blogId') blogId: string,
    @Body() newPost: NewPost,
  ) {
    return this.postsService.create({
      ...newPost,
      blogId,
    });
  }

  @UseGuards(ExistingBlogGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':blogId')
  async updateBlogger(
    @Param('blogId') id: string,
    @Body() bloggersDto: BloggersDto,
    @CurrentUserId() userId: string,
  ): Promise<boolean> {
    return this.bloggersService.updateBlogger(id, { ...bloggersDto });
  }

  @UseGuards(ExistingPostGuard, ExistingBlogGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':blogId/posts/:postId')
  async updatePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() posts: NewPost,
  ) {
    return this.postsService.update({ postId, ...posts });
  }

  @UseGuards(ExistingBlogGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':blogId')
  async deleteBlogger(@Param('blogId') id: string): Promise<boolean> {
    return this.bloggersService.deleteBlogger(id);
  }

  @UseGuards(ExistingPostGuard, ExistingBlogGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':blogId/posts/:postId')
  async deletePostForExistingBlogger(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ) {
    return this.postsService.remove(postId);
  }
}
