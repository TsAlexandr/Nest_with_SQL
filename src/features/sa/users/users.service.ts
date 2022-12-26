import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { AuthService } from '../../public/auth/auth.service';
import { v4 } from 'uuid';
import { EmailService } from '../../../adapters/email.service';
import { RegistrationDto } from '../../public/auth/dto/registration.dto';
import { NewPasswordDto } from '../../public/auth/dto/newPassword.dto';
import { SortOrder } from 'mongoose';
import { BanUserDto } from './dto/banUser.dto';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private authService: AuthService,
    private emailService: EmailService,
  ) {}

  async getAllUsers(
    page: number,
    pageSize: number,
    searchLoginTerm: string,
    searchEmailTerm: string,
    sortBy: string,
    sortDirection: any,
  ) {
    return await this.usersRepository.getUsers(
      page,
      pageSize,
      searchLoginTerm,
      searchEmailTerm,
      sortBy,
      sortDirection,
    );
  }

  async deleteUser(id: string) {
    return await this.usersRepository.delUser(id);
  }

  async findUserById(currentUserId: string) {
    return await this.usersRepository.findById(currentUserId);
  }

  async confirmPassword(newPasswordDto: NewPasswordDto) {
    const userCode = await this.usersRepository.findUserByCode(
      newPasswordDto.recoveryCode,
    );
    if (!userCode) {
      return false;
    }
    const generatePassword = await this.authService._generateHash(
      newPasswordDto.newPassword,
    );
    const user = await this.usersRepository.confirmPassword(
      userCode.id,
      generatePassword,
    );
    if (!user) return false;
    return user;
  }

  async sendRecoveryCode(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return true;
    const recoveryCode = v4();
    const formRecoveryCodeToMessage =
      this.emailService.getRecoveryMessage(recoveryCode);
    const recoveryData = {
      recoveryCode: recoveryCode,
      expirationDate: new Date(),
      isConfirmed: false,
    };

    const updateUser = await this.usersRepository.updateUserWithRecoveryData(
      user.id,
      recoveryData,
    );
    console.log(
      updateUser,
      'user after update information about recovery data',
    );
    if (updateUser) {
      await this.emailService.sendEmail(
        updateUser.email,
        'Your recovery code',
        formRecoveryCodeToMessage,
      );
      return;
    }
  }
  banUser(userId: string, banInfo: BanUserDto) {
    return this.usersRepository.banUser(userId, banInfo);
  }
}
