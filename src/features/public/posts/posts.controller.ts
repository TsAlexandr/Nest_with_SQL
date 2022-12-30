import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { Actions } from '../../../common/types/classes/classes';
import { JwtAuthGuards } from '../auth/guards/jwt-auth.guards';
import { ExistingPostGuard } from '../auth/guards/existingPostGuard';
import { UsersService } from '../../sa/users/users.service';
import { Pagination } from '../../../common/types/classes/pagination';
import { UpdateCommentDto } from '../comments/dto/update-comment.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetPostByIdCommand } from '../../usecases/queryCommands/getPostById.command';
import { JwtExtract } from '../auth/guards/jwt.extract';
import { GetCommentsCommand } from '../../usecases/queryCommands/getComments.command';
import { CreateCommentCommand } from '../../usecases/commands/createComment.command';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private usersService: UsersService,
    private queryBus: QueryBus,
    private commandBus: CommandBus,
  ) {}

  @UseGuards(JwtExtract)
  @Get()
  async getAll(@Query() query, @Req() req) {
    const { page, pageSize, searchNameTerm, sortBy, sortDirection } =
      Pagination.getPaginationData(query);
    const userId = req.user.userId || null;
    return this.postsService.findAll(
      page,
      pageSize,
      userId,
      null,
      searchNameTerm,
      sortBy,
      sortDirection,
    );
  }
  @UseGuards(JwtExtract)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const post = await this.queryBus.execute(
      new GetPostByIdCommand(id, req.user?.userId),
    );
    if (!post) throw new NotFoundException();
    return post;
  }

  @UseGuards(JwtExtract)
  @Get(':postId/comments')
  async getCommentsInPages(
    @Query() query,
    @Param('postId') postId: string,
    @Req() req,
  ) {
    const { page, pageSize, sortBy, sortDirection } = Pagination.getData(query);
    const userId = req.user.userId || null;
    const post = await this.postsService.findOne(postId, null);
    if (!post) throw new NotFoundException();
    return await this.queryBus.execute(
      new GetCommentsCommand(
        postId,
        page,
        pageSize,
        userId,
        sortBy,
        sortDirection,
      ),
    );
  }

  @UseGuards(JwtAuthGuards)
  @Post(':postId/comments')
  async createCommentForPost(
    @Param('postId') postId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req,
  ) {
    const userLogin = req.user.payload.userLogin;
    const userId = req.user.payload.userId;
    const isPost = await this.postsService.findOne(postId, null);
    if (!isPost) throw new NotFoundException();
    return this.commandBus.execute(
      new CreateCommentCommand(
        postId,
        updateCommentDto.content,
        userId,
        userLogin,
        isPost.blogId,
      ),
    );
  }

  /*@UseGuards(JwtAuthGuards, ExistingPostGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':postId/like-status')
  async updateActions(
    @Param('postId') postId: string,
    @Body('likeStatus') likeStatus: Actions,
    @Req() req,
  ) {
    if (Object.values(Actions).includes(likeStatus)) {
      const userId = req.user.payload.userId;
      const user = await this.usersService.findUserById(userId);

      return await this.postsService.updateActions(
        postId,
        likeStatus,
        userId,
        user.login,
      );
    }

    throw new HttpException(
      { message: [{ message: 'invalid value', field: 'likeStatus' }] },
      HttpStatus.BAD_REQUEST,
    );
  }*/
}
