import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUserId } from '../../common/custom-decorator/current.user.decorator';
import { GetMyStats } from './usecases/get-my-stats';

@Controller('pair-game-quiz/users')
export class QuizUsersController {
  constructor(private queryBus: QueryBus) {}
  @Get('my-statistic')
  async getMyStats(@CurrentUserId() userId: string) {
    return this.queryBus.execute(new GetMyStats(userId));
  }
}
