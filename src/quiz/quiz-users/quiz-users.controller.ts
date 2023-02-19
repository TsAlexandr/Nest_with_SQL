import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUserId } from '../../common/custom-decorator/current.user.decorator';
import { GetMyStats } from './usecases/get-my-stats';
import { JwtAuthGuards } from '../../features/public/auth/guards/jwt-auth.guards';
import { GetUsersTop } from './usecases/get-users-top';
import { QueryTopUsersDto } from './dto/query-top-users';

@UseGuards(JwtAuthGuards)
@Controller('pair-game-quiz/users')
export class QuizUsersController {
  constructor(private queryBus: QueryBus) {}
  @Get('my-statistic')
  async getMyStats(@CurrentUserId() userId: string) {
    return this.queryBus.execute(new GetMyStats(userId));
  }
  @Get('top')
  async getUsersTop(@Query() query: QueryTopUsersDto) {
    return this.queryBus.execute(new GetUsersTop(query));
  }
}
