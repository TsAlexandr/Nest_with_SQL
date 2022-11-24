import {
  Body,
  Controller,
  Delete,
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
import { JwtExtract } from '../auth/guards/jwt.extract';
import { AuthGuard } from '../auth/guards/auth.guard';
import { JwtAuthGuards } from '../auth/guards/jwt-auth.guards';
import { CommentBelongsGuard } from '../auth/guards/commentBelongsGuard';
import { UsersService } from '../users/users.service';
import { Actions } from '../../common/types/classes/classes';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private usersService: UsersService,
  ) {}

  @UseGuards(JwtExtract)
  @Get(':id')
  async findComment(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId || null;
    return await this.commentsService.findComment(id, userId);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id')
  async updateComment(@Param('id') id: string, @Body() content: string) {
    const comment = await this.commentsService.findComment(id, null);
    if (!comment) throw new NotFoundException();
    return await this.commentsService.updateComment(id, content);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteComment(@Param('id') id: string) {
    const comment = await this.commentsService.findComment(id, null);
    if (!comment) throw new NotFoundException();
    return await this.commentsService.deleteComment(id);
  }

  @UseGuards(JwtAuthGuards)
  @UseGuards(CommentBelongsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':commentId/like-status')
  async updateActions(
    @Param('commentId') commentId: string,
    @Body('likeStatus') status: Actions,
    @Req() req,
  ) {
    if (Object.values(Actions).includes(status)) {
      const userId = req.user.payload.userId;
      const user = await this.usersService.findUserById(userId);
      return await this.commentsService.updateLikes(
        commentId,
        status,
        userId,
        user.login,
      );
    }
    throw new HttpException(
      { message: [{ message: 'invalid value', field: 'likeStatus' }] },
      HttpStatus.BAD_REQUEST,
    );
  }
}
