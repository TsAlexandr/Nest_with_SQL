import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { CreateQuizPairDto } from './dto/create-quiz-pair.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuards } from '../../features/public/auth/guards/jwt-auth.guards';
import { CurrentUserId } from '../../common/custom-decorator/current.user.decorator';
import { ConnectToPairCommand } from './usecases/connect-to-pair';
import { SendAnswer } from './usecases/send-answer';
import { MyCurrentGamePair } from './usecases/my-current-game-pair';
import { FindGameById } from './usecases/find-game-by-id';
import { ValidIdDto } from './dto/valid-id-dto';
import { PairQueryDto } from './dto/pair-query.dto';
import { GetAllGames } from './usecases/getAllGames';

@UseGuards(JwtAuthGuards)
@Controller('pair-game-quiz')
export class QuizPairController {
  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @HttpCode(HttpStatus.OK)
  @Post('pairs/my-current/answers')
  async sendAnswers(
    @Body() createQuizPairDto: CreateQuizPairDto,
    @CurrentUserId() userId: string,
  ) {
    return this.commandBus.execute(
      new SendAnswer(userId, createQuizPairDto.answer),
    );
  }
  @HttpCode(HttpStatus.OK)
  @Post('pairs/connection')
  async connectToPair(@CurrentUserId() userId: string) {
    return this.commandBus.execute(new ConnectToPairCommand(userId));
  }

  @Get('pairs/my-current')
  async findCurrentGame(@CurrentUserId() userId: string) {
    return this.queryBus.execute(new MyCurrentGamePair(userId));
  }

  @Get('pairs/:id')
  async findGameById(
    @Param()
    { id }: ValidIdDto,
    @CurrentUserId() userId: string,
  ) {
    return this.queryBus.execute(new FindGameById(id, userId));
  }

  @Get('my')
  async getAllMyGames(
    @Query() query: PairQueryDto,
    @CurrentUserId() userId: string,
  ) {
    return this.queryBus.execute(new GetAllGames(query, userId));
  }
}
