import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TruncateBase,
  TestRepo,
} from './library/truncateBaseForTests/truncateBase';
import { PostsController } from './features/public/posts/posts.controller';
import { BlogsController } from './features/public/blogs/blogs.controller';
import { UsersController } from './features/sa/users/users.controller';
import { AuthController } from './features/public/auth/auth.controller';
import { CommentsController } from './features/public/comments/comments.controller';
import { BlogsRepository } from './features/public/blogs/blogs.repository';
import { CommentsRepository } from './features/public/comments/comments.repository';
import { UsersService } from './features/sa/users/users.service';
import { ExistingPostGuard } from './features/public/auth/guards/existingPostGuard';
import { JwtExtract } from './features/public/auth/guards/jwt.extract';
import { JwtAuthGuards } from './features/public/auth/guards/jwt-auth.guards';
import { UsersRepository } from './features/sa/users/users.repository';
import { BasicGuards } from './features/public/auth/guards/basic.guards';
import { JwtStrategy } from './features/public/auth/strategies/jwt.strategy';
import { BlogsService } from './features/public/blogs/blogs.service';
import { PostsService } from './features/public/posts/posts.service';
import { CommentsService } from './features/public/comments/comments.service';
import { PostsRepository } from './features/public/posts/posts.repository';
import { AuthService } from './features/public/auth/auth.service';
import { EmailService } from './adapters/email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloggersEntity } from './features/public/blogs/entities/bloggers.entity';
import { PostEntity } from './features/public/posts/entities/post.entity';
import { CommentEntity } from './features/public/comments/entities/comment.entity';
import { UserEntity } from './features/sa/users/entities/user.entity';
import { DeviceController } from './features/public/devices/device.controller';
import { DeviceService } from './features/public/devices/device.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { DeviceRepository } from './features/public/devices/device.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { GetCommentsHandler } from './features/usecases/queryHandlers/getComments.handler';
import { CreateCommentHandler } from './features/usecases/handlers/createComment.handler';
import { BlogIdValidation } from './common/exceptions/validationBlog';
import { TelegramController } from './telegram/telegram.controller';
import { TelegramAdapter } from './adapters/telegram.adapter';
import { FilesController } from './files/files.controller';
import { SaveFilesHandler } from './features/usecases/handlers/save-files.handler';
import { SuperBlogsController } from './features/sa/bloggersSA/bloggers.controller_sa';
import { BloggerController } from './features/blogger/blogger.controller';
import { GetCommentByIdHandler } from './features/usecases/queryHandlers/getCommentById.handler';
import { GetPostByIdHandler } from './features/usecases/queryHandlers/getPostById.handler';
import { BanUserHandler } from './features/usecases/handlers/banUser.handler';
import { GetAllBlogsHandler } from './features/usecases/queryHandlers/getAllBlogs.handler';
import { GetBannedUserForBloggerHandler } from './features/usecases/queryHandlers/getBannedUserForBlogger.handler';
import { GetBlogsByIdHandler } from './features/usecases/queryHandlers/getBlogsById.handler';
import { BanUserForBlogHandler } from './features/usecases/handlers/banUserForBlog.handler';
import { BanBlogByIdHandler } from './features/usecases/handlers/banBlogById.handler';
import { GetAllBloggerCommentsHandler } from './features/usecases/queryHandlers/getAllBloggerComments.handler';
import { BloggerUsersController } from './features/blogger/blogger-users.controller';
import { CreateUserCommandHandler } from './features/usecases/handlers/createUserCommand.handler';
import { GetAllBloggersBlogsHandler } from './features/usecases/queryHandlers/getAllBloggersBlogs.handler';
import { GetAllPostsHandler } from './features/usecases/queryHandlers/getAllPosts.handler';
import { ActionsEntity } from './library/entities/actions.entity';
import { BanInfoEntity } from './library/entities/banInfo.entity';
import { UserBlackListEntity } from './library/entities/userBlackList.entity';
import { DeviceEntity } from './features/public/devices/entities/device.entity';
import { EmailConfirmEntity } from './library/entities/emailConfirm.entity';
import { RecoveryDataEntity } from './library/entities/recoveryData.entity';
import { QuizModule } from './quiz/quiz.module';
import { QuizQuestionsEntity } from './quiz/entities/quiz.questions.entity';
import { QuizAnswersEntity } from './quiz/entities/quiz.answers.entity';
import { PlayerProgressEntity } from './quiz/entities/player-progress.entity';
import { QuizGameEntity } from './quiz/entities/quiz-game.entity';

export const CommandHandlers = [
  GetAllBlogsHandler,
  GetBannedUserForBloggerHandler,
  GetBlogsByIdHandler,
  GetCommentsHandler,
  GetCommentByIdHandler,
  GetPostByIdHandler,
  GetAllBloggerCommentsHandler,
  GetAllBloggersBlogsHandler,
  GetAllPostsHandler,
  CreateCommentHandler,
  SaveFilesHandler,
  BanUserHandler,
  BanUserForBlogHandler,
  BanBlogByIdHandler,
  CreateUserCommandHandler,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USER'),
          password: configService.get('DB_PASS'),
          database: configService.get('DB_NAME'),
          entities: [
            BloggersEntity,
            PostEntity,
            CommentEntity,
            UserEntity,
            ActionsEntity,
            BanInfoEntity,
            UserBlackListEntity,
            DeviceEntity,
            EmailConfirmEntity,
            RecoveryDataEntity,
            QuizQuestionsEntity,
            QuizAnswersEntity,
            PlayerProgressEntity,
            QuizGameEntity,
          ],
          synchronize: true,
          /*extra: {
            poolSize: 4,
          },*/
        };
      },
    }),
    CqrsModule,
    QuizModule,
  ],
  controllers: [
    TelegramController,
    AppController,
    PostsController,
    CommentsController,
    UsersController,
    AuthController,
    TruncateBase,
    DeviceController,
    BlogsController,
    FilesController,
    SuperBlogsController,
    BloggerController,
    BloggerUsersController,
  ],
  providers: [
    BlogsService,
    BlogsRepository,
    PostsService,
    CommentsService,
    UsersService,
    PostsRepository,
    CommentsRepository,
    UsersRepository,
    AuthService,
    EmailService,
    AppService,
    JwtStrategy,
    JwtAuthGuards,
    BasicGuards,
    TestRepo,
    ExistingPostGuard,
    JwtExtract,
    DeviceService,
    DeviceRepository,
    ...CommandHandlers,
    BlogIdValidation,
    TelegramAdapter,
  ],
})
export class AppModule {}
