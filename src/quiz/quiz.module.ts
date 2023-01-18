import { Module } from '@nestjs/common';
import { QuizService } from './quiz-questions/quiz.service';
import { QuizController } from './quiz-questions/quiz.controller';
import { QuizRepository } from './quiz.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateQuestionHandler } from './usecases/commandHandlers/createQuestion';
import { FindAllQuestionsHandler } from './usecases/queryHandlers/findAllQuestions';
import { UpdateQuestionHandler } from './usecases/commandHandlers/updateQuestion';
import { UpdatePublishHandler } from './usecases/commandHandlers/updatePublish';
import { QuestionIsExist } from './guards/questionIsExist';
import { QuizPairController } from './quiz-pair/quiz-pair.controller';

@Module({
  imports: [CqrsModule],
  controllers: [QuizController, QuizPairController],
  providers: [
    QuizService,
    QuizRepository,
    CreateQuestionHandler,
    FindAllQuestionsHandler,
    UpdateQuestionHandler,
    UpdatePublishHandler,
    QuestionIsExist,
  ],
})
export class QuizModule {}
