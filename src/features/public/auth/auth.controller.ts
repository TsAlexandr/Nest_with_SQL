import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
  Headers,
  HttpException,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../sa/users/users.service';
import { AuthService } from './auth.service';
import { CurrentUserId } from '../../../common/custom-decorator/current.user.decorator';
import { JwtAuthGuards } from './guards/jwt-auth.guards';
import { EmailService } from '../../../adapters/email.service';
import { RegistrationDto } from './dto/registration.dto';
import { LoginDto } from './dto/login.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { NewPasswordDto } from './dto/newPassword.dto';
import { Request, Response } from 'express';
import { EmailInputDto } from './dto/emailInput.dto';
import { AuthGuard } from './guards/auth.guard';
import { CreateUserCommand } from '../../usecases/commands/createUser.command';
import { CommandBus } from '@nestjs/cqrs';

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UsersService,
    private authService: AuthService,
    private emailService: EmailService,
    private commandBus: CommandBus,
  ) {}

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/registration')
  async registration(@Body() registr: RegistrationDto) {
    const user = await this.commandBus.execute(new CreateUserCommand(registr));
    if (!user)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'code' }] },
        HttpStatus.BAD_REQUEST,
      );
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/registration-confirmation')
  async confirmClient(@Body('code') code: string) {
    const confirm = await this.emailService.confirmEmail(code);
    if (!confirm)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'code' }] },
        HttpStatus.BAD_REQUEST,
      );
    return null;
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/registration-email-resending')
  async resendEmail(@Body() inputEmail: EmailInputDto) {
    const send = await this.emailService.resendRegistrationCode(
      inputEmail.email,
    );
    if (!send)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'email' }] },
        HttpStatus.BAD_REQUEST,
      );
    return null;
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(
    @Body() loginBody: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
    @Headers('user-agent') title: string,
  ) {
    const result = await this.authService.checkCredentials(
      loginBody,
      ip,
      title,
    );
    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return { accessToken: result.data.accessToken };
  }

  @HttpCode(HttpStatus.OK)
  @Post('/refresh-token')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.cookies.refreshToken) {
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'refreshToken' }] },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const tokens = await this.authService.updateDevice(
      req.cookies.refreshToken,
    );
    if (!tokens) throw new UnauthorizedException();
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return { accessToken: tokens.accessToken };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/logout')
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    if (!req.cookies.refreshToken) {
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'refreshToken' }] },
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.authService.removeSession(req.cookies.refreshToken);
    res.clearCookie('refreshToken');
  }

  @UseGuards(AuthGuard, JwtAuthGuards)
  @Get('/me')
  async infoAboutMe(@CurrentUserId() id: string) {
    const user = await this.userService.findUserById(id);
    return {
      userId: user.id,
      email: user.email,
      login: user.login,
    };
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/password-recovery')
  async recoveryPass(@Body() inputEmail: EmailInputDto) {
    await this.userService.sendRecoveryCode(inputEmail.email);
    return true;
  }

  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('/new-password')
  async getNewPass(@Body() newPasswordDto: NewPasswordDto) {
    const newPassword = await this.userService.confirmPassword(newPasswordDto);
    if (!newPassword)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'recoveryCode' }] },
        HttpStatus.BAD_REQUEST,
      );
    return true;
  }
}
