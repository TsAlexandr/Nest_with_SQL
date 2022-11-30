import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import {
  TruncateBase,
  TestRepo,
} from './library/truncateBaseForTests/truncateBase';
import {
  BloggerSchema,
  BloggersMongo,
  Comments,
  CommentsSchema,
  Device,
  DeviceSchema,
  Posts,
  PostsSchema,
  UserMongo,
  UserSchema,
} from './common/types/schemas/schemas.model';
import { PostsController } from './features/posts/posts.controller';
import { BloggersController } from './features/bloggers/bloggers.controller';
import { UsersController } from './features/users/users.controller';
import { AuthController } from './features/auth/auth.controller';
import { CommentsController } from './features/comments/comments.controller';
import { BloggersRepository } from './features/bloggers/bloggers.repository';
import { CommentsRepository } from './features/comments/comments.repository';
import { UsersService } from './features/users/users.service';
import { ExistingPostGuard } from './features/auth/guards/existingPostGuard';
import { JwtExtractStrategy } from './features/auth/strategies/jwt.extract.strategy';
import { JwtExtract } from './features/auth/guards/jwt.extract';
import { JwtAuthGuards } from './features/auth/guards/jwt-auth.guards';
import { LocalAuthGuards } from './features/auth/guards/local-auth.guards';
import { UsersRepository } from './features/users/users.repository';
import { BasicGuards } from './features/auth/guards/basic.guards';
import { JwtStrategy } from './features/auth/strategies/jwt.strategy';
import { BloggersService } from './features/bloggers/bloggers.service';
import { PostsService } from './features/posts/posts.service';
import { CommentsService } from './features/comments/comments.service';
import { PostsRepository } from './features/posts/posts.repository';
import { AuthService } from './features/auth/auth.service';
import { EmailService } from './email/email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloggersRepositoryRAW } from './library/rawDb/bloggersRepositoryRAW';
import { BloggersEntity } from './features/bloggers/entities/bloggers.entity';
import { PostEntity } from './features/posts/entities/post.entity';
import { CommentEntity } from './features/comments/entities/comment.entity';
import { UserEntity } from './features/users/entities/user.entity';
import { PostsRepositoryRAW } from './library/rawDb/postsRepositoryRAW';
import { TotalActionsEntity } from './library/entities/actions.entity';
import { DeviceController } from './features/devices/device.controller';
import { DeviceService } from './features/devices/device.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { DeviceRepository } from './features/devices/device.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { GetCommentsHandler } from './features/usecase/handlers/getComments.handler';
import { CreateCommentHandler } from './features/usecase/handlers/createComment.handler';
import { BloggersRepositoryORM } from './library/typeORM/bloggers.typeORM';
import { BlogIdValidation } from './common/exceptions/validationBlog';
import { TelegramController } from './telegram/telegram.controller';
import { TelegramService } from 'nestjs-telegram';

export const CommandHandlers = [GetCommentsHandler, CreateCommentHandler];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([
      { name: Posts.name, schema: PostsSchema },
      { name: BloggersMongo.name, schema: BloggerSchema },
      { name: Comments.name, schema: CommentsSchema },
      { name: UserMongo.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
    ]),
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: 'ec2-3-208-79-113.compute-1.amazonaws.com',
    //   port: 5432,
    //   url: process.env.DATABASE_URL,
    //   entities: [UserEntity,
    //         PostEntity,
    //         CommentEntity,
    //         BloggersEntity,
    //         TotalActionsEntity,],
    //   synchronize: true,
    //   ssl: { rejectUnauthorized: false },
    // }),
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: 'localhost',
    //   port: 5432,
    //   username: 'postgres',
    //   password: 'root',
    //   database: 'postgres',
    //   entities: [
    //     UserEntity,
    //     PostEntity,
    //     CommentEntity,
    //     BloggersEntity,
    //     TotalActionsEntity,
    //   ],
    //   synchronize: true,
    // }),
    CqrsModule,
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
    BloggersController,
  ],
  providers: [
    BloggersService,
    BloggersRepository,
    {
      provide: 'IBlogsRepository',
      useClass: BloggersRepository,
    },
    PostsService,
    CommentsService,
    UsersService,
    PostsRepository,
    CommentsRepository,
    UsersRepository,
    AuthService,
    EmailService,
    AppService,
    JwtExtractStrategy,
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
  ],
})
export class AppModule {}
