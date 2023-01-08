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
import { CurrentUserId } from '../../../common/custom-decorator/current.user.decorator';
import { GetAllPostsCommand } from '../../usecases/queryCommands/getAllPosts.command';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private usersService: UsersService,
    private queryBus: QueryBus,
    private commandBus: CommandBus,
    private configService: ConfigService,
  ) {}

  @UseGuards(JwtExtract)
  @Get()
  async getAll(@Query() query, @Req() req) {
    const { page, pageSize, sortBy, sortDirection } = Pagination.getData(query);
    return this.queryBus.execute(
      new GetAllPostsCommand(
        page,
        pageSize,
        sortBy,
        sortDirection,
        req.user.userId,
      ),
    );
  }
  @UseGuards(JwtExtract)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    let currentUserId = null;
    if (req.headers.authorization) {
      const secret = this.configService.get('JWT_SECRET_KEY');
      const user: any = jwt.verify(
        req.headers.authorization.split(' ')[1],
        secret,
      );
      if (user) {
        currentUserId = user.userId;
      }
    }
    const post = await this.queryBus.execute(
      new GetPostByIdCommand(id, currentUserId),
    );
    if (!post) throw new NotFoundException();
    return post;
  }

  @UseGuards(JwtExtract, ExistingPostGuard)
  @Get(':postId/comments')
  async getCommentsInPages(
    @Query() query,
    @Param('postId') postId: string,
    @Req() req,
  ) {
    const { page, pageSize, sortBy, sortDirection } = Pagination.getData(query);
    return await this.queryBus.execute(
      new GetCommentsCommand(
        postId,
        page,
        pageSize,
        req.user?.userId,
        sortBy,
        sortDirection,
      ),
    );
  }

  @UseGuards(JwtAuthGuards, ExistingPostGuard)
  @Post(':postId/comments')
  async createCommentForPost(
    @Param('postId') postId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUserId() userId: string,
  ) {
    return this.commandBus.execute(
      new CreateCommentCommand(postId, updateCommentDto.content, userId),
    );
  }

  @UseGuards(JwtAuthGuards, ExistingPostGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':postId/like-status')
  async updateActions(
    @Param('postId') postId: string,
    @Body('likeStatus') likeStatus: Actions,
    @CurrentUserId() userId: string,
  ) {
    if (Object.values(Actions).includes(likeStatus)) {
      return await this.postsService.updateActions(postId, likeStatus, userId);
    }

    throw new HttpException(
      { message: [{ message: 'invalid value', field: 'likeStatus' }] },
      HttpStatus.BAD_REQUEST,
    );
  }
}
