import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AuthService } from '../../public/auth/auth.service';
import { EmailService } from '../../../adapters/email.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../../../library/schemas/schemas.model';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          'mongodb+srv://hello:rerere@cluster0.rxylv.mongodb.net/Cluster0?retryWrites=true&w=majority',
        ),
        MongooseModule.forFeature([{ name: 'Users', schema: UserSchema }]),
      ],
      controllers: [UsersController],
      providers: [UsersService, UsersRepository, AuthService, EmailService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
