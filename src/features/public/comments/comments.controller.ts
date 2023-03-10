import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { JwtAuthGuards } from '../auth/guards/jwt-auth.guards';
import { CommentBelongsGuard } from '../auth/guards/commentBelongsGuard';
import { UsersService } from '../../sa/users/users.service';
import { Actions } from '../../../common/classes/classes';
import { CurrentUserId } from '../../../common/custom-decorator/current.user.decorator';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryBus } from '@nestjs/cqrs';
import { GetCommentByIdCommand } from '../../usecases/queryCommands/getCommentById.commmand';
import { JwtExtract } from '../auth/guards/jwt.extract';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private usersService: UsersService,
    private queryBus: QueryBus,
    private configService: ConfigService,
  ) {}

  @UseGuards(JwtExtract)
  @Get(':commentId')
  async findComment(@Param('commentId') id: string, @Req() req) {
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
    return this.queryBus.execute(new GetCommentByIdCommand(id, currentUserId));
  }

  @UseGuards(AuthGuard, JwtAuthGuards)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id')
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUserId() userId: string,
  ) {
    const comment = await this.commentsService.findComment(id);
    if (!comment) throw new NotFoundException();
    if (userId !== comment.userId) throw new ForbiddenException();
    return this.commentsService.updateComment(id, updateCommentDto.content);
  }

  @UseGuards(JwtAuthGuards, CommentBelongsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':commentId/like-status')
  async updateActions(
    @Param('commentId') commentId: string,
    @Body('likeStatus') status: Actions,
    @CurrentUserId() userId: string,
  ) {
    if (Object.values(Actions).includes(status)) {
      return this.commentsService.updateLikes(commentId, status, userId);
    }
    throw new HttpException(
      { message: [{ message: 'invalid value', field: 'likeStatus' }] },
      HttpStatus.BAD_REQUEST,
    );
  }

  @UseGuards(AuthGuard, JwtAuthGuards)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteComment(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    const comment = await this.commentsService.findComment(id);
    if (!comment) throw new NotFoundException();
    if (userId !== comment.userId) throw new ForbiddenException();
    return this.commentsService.deleteComment(id);
  }
}
