import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { QueryDto } from './dto/query.dto';
import { FindAllQuestions } from './usecases/queryHandlers/findAllQuestions';
import { CreateQuestionCommand } from './usecases/commandHandlers/createQuestion';

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

  @Patch(':id')
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return this.quizService.update(id, updateQuizDto);
  }

  @Patch(':id')
  async updatePublish(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return this.quizService.update(id, updateQuizDto);
  }

  @Delete(':id')
  async removeQuestion(@Param('id') id: string) {
    return this.quizService.remove(id);
  }
}
