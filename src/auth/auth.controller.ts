import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import {
  Cookies,
  CurrentUserId,
} from '../common/custom-decorator/current.user.decorator';
import { JwtAuthGuards } from './guards/jwt-auth.guards';
import { EmailService } from '../email/email.service';
import { LocalAuthGuards } from './guards/local-auth.guards';
import { RegistrationDto } from './dto/registration.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UsersService,
    private authService: AuthService,
    private emailService: EmailService,
  ) {}

  @Post('/registration')
  async registration(@Body() registr: RegistrationDto) {
    const created = await this.userService.createUser(registr);
    return null;
  }

  @Post('/registration-confirmation')
  async confirmClient(@Body() code: string) {
    const confirm = await this.emailService.confirmEmail(code);
    if (!confirm) throw new NotFoundException();
    return null;
  }

  @Post('/registration-email-resending')
  async resendEmail(@Body() email: string) {
    const send = await this.emailService.resendRegistrationCode(email);
    if (!send) throw new BadRequestException();
    return null;
  }
  @UseGuards(LocalAuthGuards)
  @HttpCode(200)
  @Post('/login')
  async login(
    @Body() loginBody: LoginDto,
    @Req() req,
    @Res({ passthrough: true }) res,
  ) {
    const result = await this.authService.checkCredentials(loginBody);
    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return { accessToken: result.data.accessToken };
  }
  @UseGuards(JwtAuthGuards)
  @Post('/refresh-token')
  async refresh(@Req() req, @Res() res, @Cookies() cookie) {
    console.log(cookie);
    if (!cookie.refreshToken) throw new UnauthorizedException();
    const userId = req.user.payload.sub;
    const tokens = await this.authService.createTokens(userId);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return { accessToken: tokens.accessToken };
  }

  @Post('/logout')
  async logout(@Req() req) {
    if (!req.cookie.refreshToken) throw new UnauthorizedException();
    await this.userService.addToken(req.cookies.refreshToken);
    return null;
  }

  @UseGuards(JwtAuthGuards)
  @Post('/me')
  async infoAboutMe(@CurrentUserId() currentUserId: string) {
    const user = await this.userService.findUserById(currentUserId);
    return {
      userId: user.accountData.id,
      email: user.accountData.email,
      login: user.accountData.login,
    };
  }
}
