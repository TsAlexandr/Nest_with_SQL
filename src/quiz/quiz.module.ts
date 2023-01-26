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
import { SendAnswerHandler } from './quiz-pair/usecases/send-answer';
import { UserInPair } from '../features/public/auth/guards/user-in-pair';
import { MyCurrentPairHandler } from './quiz-pair/usecases/my-current-game-pair';
const handlers = [
  CreateQuestionHandler,
  FindAllQuestionsHandler,
  UpdateQuestionHandler,
  UpdatePublishHandler,
  ConnectToPairHandler,
  SendAnswerHandler,
  MyCurrentPairHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [QuizController, QuizPairController],
  providers: [
    QuizService,
    QuizRepository,
    QuestionIsExist,
    ...handlers,
    UserInPair,
  ],
})
export class QuizModule {}
