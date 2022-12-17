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
import { BloggersRepositoryRAW } from './library/rawDb/bloggersRepositoryRAW';
import { BloggersEntity } from './features/public/blogs/entities/bloggers.entity';
import { PostEntity } from './features/public/posts/entities/post.entity';
import { CommentEntity } from './features/public/comments/entities/comment.entity';
import { UserEntity } from './features/sa/users/entities/user.entity';
import { PostsRepositoryRAW } from './library/rawDb/postsRepositoryRAW';
import { TotalActionsEntity } from './library/entities/actions.entity';
import { DeviceController } from './features/public/devices/device.controller';
import { DeviceService } from './features/public/devices/device.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { DeviceRepository } from './features/public/devices/device.repository';
import { CqrsModule } from '@nestjs/cqrs';
import { GetCommentsHandler } from './features/usecases/queryHandlers/getComments.handler';
import { CreateCommentHandler } from './features/usecases/handlers/createComment.handler';
import { BloggersRepositoryORM } from './library/typeORM/bloggers.typeORM';
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

export const CommandHandlers = [
  GetAllBlogsHandler,
  GetBannedUserForBloggerHandler,
  GetBlogsByIdHandler,
  GetCommentsHandler,
  GetCommentByIdHandler,
  GetPostByIdHandler,
  GetAllBloggerCommentsHandler,
  CreateCommentHandler,
  SaveFilesHandler,
  BanUserHandler,
  BanUserForBlogHandler,
  BanBlogByIdHandler,
];

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
    BlogsController,
    FilesController,
    SuperBlogsController,
    BloggerController,
    BloggerUsersController,
  ],
  providers: [
    BlogsService,
    BlogsRepository,
    {
      provide: 'IBlogsRepository',
      useClass: BlogsRepository,
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
