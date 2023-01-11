import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../commands/createUser.command';
import { UsersRepository } from '../../sa/users/users.repository';
import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 } from 'uuid';
import { AuthService } from '../../public/auth/auth.service';
import { EmailService } from '../../../adapters/email.service';

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand>
{
  constructor(
    private usersRepository: UsersRepository,
    private authService: AuthService,
    private emailService: EmailService,
  ) {}
  async execute(command: CreateUserCommand) {
    const { createUser } = command;
    const validEmail = await this.usersRepository.findByEmail(createUser.email);
    if (validEmail)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'email' }] },
        HttpStatus.BAD_REQUEST,
      );
    const validLogin = await this.usersRepository.findByLogin(createUser.login);
    if (validLogin)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'login' }] },
        HttpStatus.BAD_REQUEST,
      );
    const passwordHash = await this.authService._generateHash(
      createUser.password,
    );
    const user = {
      id: v4(),
      login: createUser.login,
      email: createUser.email,
      passwordHash,
      createdAt: new Date().toISOString(),
      confirmationCode: v4(),
      recoveryCode: '',
      expirationDate: new Date(),
    };

    const createdUser = await this.usersRepository.createUser(user);
    if (createdUser) {
      const messageBody = this.emailService.getConfirmMessage(
        user.confirmationCode,
      );
      await this.emailService.sendEmail(
        user.email,
        'Confirm your email',
        messageBody,
      );
      return {
        id: createdUser.q.id,
        login: createdUser.q.login,
        email: createdUser.q.email,
        createdAt: createdUser.q.createdAt,
        banInfo: {
          banDate: createdUser.b.banDate,
          banReason: createdUser.b.banReason,
          isBanned: createdUser.b.isBanned,
        },
      };
    } else {
      return null;
    }
  }
}
