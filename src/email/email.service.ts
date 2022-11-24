import { UsersRepository } from '../features/users/users.repository';
import * as nodemailer from 'nodemailer';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private usersRepository: UsersRepository) {}

  async sendEmail(email: string, subject: string, message: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_LOGIN,
        pass: process.env.EMAIL_PASS,
      },
    });
    try {
      await transporter.sendMail({
        from: 'Alex Gerber <process.env.EMAIL_LOGIN>', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        html: message,
      });
    } catch (e) {
      console.log(e);
    }
  }

  async confirmEmail(code: string) {
    const user = await this.usersRepository.findByConfirmCode(code);
    if (!user) return false;
    if (user.emailConfirmation.isConfirmed)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'code' }] },
        HttpStatus.BAD_REQUEST,
      );
    const dbConfirmCode = user.emailConfirmation.confirmationCode;
    if (dbConfirmCode === code) {
      const result = await this.usersRepository.updateConfirm(user.id);
      return result;
    }
    return false;
  }

  async resendRegistrationCode(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return null;
    if (user.emailConfirmation.isConfirmed) return null;
    const updUser = await this.usersRepository.updateConfirmationCode(user.id);
    if (updUser) {
      const message = this.getConfirmMessage(
        updUser.emailConfirmation.confirmationCode,
      );
      await this.sendEmail(updUser.email, 'Confirm your email', message);
      return true;
    }
    return null;
  }

  getConfirmMessage(confirmationCode: string) {
    return `<a href="https://home-tasks-in-nest.vercel.app/auth/registration-confirmation/?code=${confirmationCode}">${confirmationCode}</a>`;
  }

  getRecoveryMessage(recoveryCode: string) {
    return `<a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>recovery password</a>`;
  }
}
