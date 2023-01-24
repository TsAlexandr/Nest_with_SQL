import { Module } from '@nestjs/common';
import { QuizService } from './quiz-questions/quiz.service';
import { QuizController } from './quiz-questions/quiz.controller';
import { QuizRepository } from './quiz.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateQuestionHandler } from './quiz-questions/usecases/commandHandlers/createQuestion';
import { FindAllQuestionsHandler } from './quiz-questions/usecases/queryHandlers/findAllQuestions';
import { UpdateQuestionHandler } from './quiz-questions/usecases/commandHandlers/updateQuestion';
import { UpdatePublishHandler } from './quiz-questions/usecases/commandHandlers/updatePublish';
import { QuestionIsExist } from './guards/questionIsExist';
import { QuizPairController } from './quiz-pair/quiz-pair.controller';
import { ConnectToPairHandler } from './quiz-pair/usecases/connect-to-pair';
import { MyCurrentGameAnswerHandler } from './quiz-pair/usecases/my-current-game-answer';
import { HelperForProgress } from '../common/helpers/helpers';
const handlers = [
  CreateQuestionHandler,
  FindAllQuestionsHandler,
  UpdateQuestionHandler,
  UpdatePublishHandler,
  ConnectToPairHandler,
  MyCurrentGameAnswerHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [QuizController, QuizPairController],
  providers: [
    QuizService,
    QuizRepository,
    QuestionIsExist,
    ...handlers,
    HelperForProgress,
  ],
})
export class QuizModule {}
