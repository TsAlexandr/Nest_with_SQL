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

@UseGuards(JwtAuthGuards)
@Controller('blogger/blogs')
export class BloggerController {
  constructor(
    private bloggersService: BlogsService,
    private postsService: PostsService,
    private usersService: UsersService,
    private queryBus: QueryBus,
  ) {}

  @Get()
  async getAllBloggers(
    @Query() query,
    @CurrentUserId() userId: string,
  ): Promise<Paginator<Blogger[]>> {
    const { page, pageSize, searchNameTerm, sortBy, sortDirection } =
      Pagination.getPaginationData(query);
    const bloggers = await this.bloggersService.getBlogsByBlogger(
      page,
      pageSize,
      searchNameTerm,
      sortBy,
      sortDirection,
      userId,
    );
    if (!bloggers) {
      throw new NotFoundException();
    }
    return bloggers;
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

  @Post(':blogId/posts')
  async createNewPostForBlogger(
    @Param('blogId') blogId: string,
    @Body() newPost: NewPost,
    @CurrentUserId() userId: string,
  ) {
    const blogger = await this.bloggersService.getBloggerById(blogId);
    if (!blogger) throw new NotFoundException();
    if (blogger.userId !== userId) throw new ForbiddenException();
    return this.postsService.create(
      {
        ...newPost,
        blogId,
      },
      blogger.name,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id')
  async updateBlogger(
    @Param('id') id: string,
    @Body() bloggersDto: BloggersDto,
    @CurrentUserId() userId: string,
  ): Promise<boolean> {
    const blog = await this.bloggersService.validateBlogId(id);
    if (!blog) throw new NotFoundException();
    if (blog.userId !== userId) throw new ForbiddenException();
    return this.bloggersService.updateBlogger(id, { ...bloggersDto });
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':blogId/posts/:postId')
  async updatePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() posts: NewPost,
    @CurrentUserId() userId: string,
  ) {
    const blog = await this.bloggersService.getBloggerById(blogId);
    if (!blog) throw new NotFoundException();
    const post = await this.postsService.findOne(postId, null);
    if (!post) throw new NotFoundException();
    if (blog.userId !== userId) throw new ForbiddenException();
    return this.postsService.update({ postId, ...posts });
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteBlogger(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ): Promise<boolean> {
    const blogger = await this.bloggersService.validateBlogId(id);
    if (!blogger) throw new NotFoundException();
    if (blogger.userId !== userId) throw new ForbiddenException();
    return this.bloggersService.deleteBlogger(id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':blogId/posts/:postId')
  async deletePostForExistingBlogger(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @CurrentUserId() userId: string,
  ) {
    const blogger = await this.bloggersService.getBloggerById(blogId);
    if (!blogger) throw new NotFoundException();
    if (blogger.userId !== userId) throw new ForbiddenException();
    const post = await this.postsService.findOne(postId, null);
    if (!post) throw new NotFoundException();
    return this.postsService.remove(postId);
  }
}
