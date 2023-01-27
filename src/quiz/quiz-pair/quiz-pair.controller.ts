import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CreateQuizPairDto } from './dto/create-quiz-pair.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuards } from '../../features/public/auth/guards/jwt-auth.guards';
import { CurrentUserId } from '../../common/custom-decorator/current.user.decorator';
import { ConnectToPairCommand } from './usecases/connect-to-pair';
import { SendAnswer } from './usecases/send-answer';
import { UserInPair } from '../../features/public/auth/guards/user-in-pair';
import { MyCurrentGamePair } from './usecases/my-current-game-pair';
import { FindGameById } from './usecases/find-game-by-id';
import { ValidIdDto } from './dto/valid-id-dto';

@UseGuards(JwtAuthGuards)
@Controller('pair-game-quiz/pairs')
export class QuizPairController {
  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @UseGuards(UserInPair)
  @Post('my-current/answers')
  async sendAnswers(
    @Body() createQuizPairDto: CreateQuizPairDto,
    @CurrentUserId() userId: string,
  ) {
    return this.commandBus.execute(
      new SendAnswer(userId, createQuizPairDto.answer),
    );
  }
  @Post('connection')
  async connectToPair(@CurrentUserId() userId: string) {
    return this.commandBus.execute(new ConnectToPairCommand(userId));
  }

  @Get('my-current')
  async findCurrentGame(@CurrentUserId() userId: string) {
    return this.queryBus.execute(new MyCurrentGamePair(userId));
  }

  @Get(':id')
  async findGameById(
    @Param('id') validId: ValidIdDto,
    @CurrentUserId() userId: string,
  ) {
    return this.queryBus.execute(new FindGameById(validId.id, userId));
  }
}
