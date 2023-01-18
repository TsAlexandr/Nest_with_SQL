import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { QuizRepository } from './quiz.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateQuestionHandler } from './usecases/commandHandlers/createQuestion';
import { FindAllQuestionsHandler } from './usecases/queryHandlers/findAllQuestions';

@Module({
  imports: [CqrsModule],
  controllers: [QuizController],
  providers: [
    QuizService,
    QuizRepository,
    CreateQuestionHandler,
    FindAllQuestionsHandler,
  ],
})
export class QuizModule {}
