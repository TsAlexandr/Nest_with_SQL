import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdatePublishDto, UpdateQuizDto } from './dto/update-quiz.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { QueryDto } from './dto/query.dto';
import { FindAllQuestions } from './usecases/queryHandlers/findAllQuestions';
import { CreateQuestionCommand } from './usecases/commandHandlers/createQuestion';
import { UpdatePublishCommand } from './usecases/commandHandlers/updatePublish';
import { BasicGuards } from '../features/public/auth/guards/basic.guards';
import { UpdateQuestionCommand } from './usecases/commandHandlers/updateQuestion';

@UseGuards(BasicGuards)
@Controller('sa/quiz/questions')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private queryBus: QueryBus,
    private commandBus: CommandBus,
  ) {}

  @Post()
  async createQuestion(@Body() createQuizDto: CreateQuizDto) {
    return this.commandBus.execute(new CreateQuestionCommand(createQuizDto));
  }

  @Get()
  async findAllQuestion(@Query() queryDto: QueryDto) {
    return this.queryBus.execute(new FindAllQuestions(queryDto));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id')
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return this.commandBus.execute(
      new UpdateQuestionCommand(id, updateQuizDto),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id/publish')
  async updatePublish(
    @Param('id') id: string,
    @Body() published: UpdatePublishDto,
  ) {
    return this.commandBus.execute(new UpdatePublishCommand(id, published));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async removeQuestion(@Param('id') id: string) {
    return this.quizService.remove(id);
  }
}
