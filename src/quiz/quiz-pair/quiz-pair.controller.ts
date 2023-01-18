import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CreateQuizPairDto } from './dto/create-quiz-pair.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuards } from '../../features/public/auth/guards/jwt-auth.guards';
import { CurrentUserId } from '../../common/custom-decorator/current.user.decorator';

@UseGuards(JwtAuthGuards)
@Controller('pair-game-quiz/pairs')
export class QuizPairController {
  constructor(private commandBus: CommandBus, private queryBus: QueryBus) {}

  @Post('my-current/answers')
  async sendAnswers(
    @Body() createQuizPairDto: CreateQuizPairDto,
    @CurrentUserId() userId: string,
  ) {
    return this.commandBus.execute(createQuizPairDto);
  }
  @Post('connection')
  async connectToPair(
    @Body() createQuizPairDto: CreateQuizPairDto,
    @CurrentUserId() userId: string,
  ) {
    return this.commandBus.execute(createQuizPairDto);
  }

  @Get('my-current')
  async findCurrentGame(@CurrentUserId() userId: string) {
    return this.queryBus.execute(userId);
  }

  @Get(':id')
  async findGameById(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.queryBus.execute(id);
  }
}
