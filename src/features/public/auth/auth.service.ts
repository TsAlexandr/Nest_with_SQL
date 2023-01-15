import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersRepository } from '../../sa/users/users.repository';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';
import { v4 } from 'uuid';
import { DeviceRepository } from '../devices/device.repository';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private deviceRepository: DeviceRepository,
    private configService: ConfigService,
  ) {}

  async checkCredentials(loginBody: LoginDto, ip: string, title: string) {
    const user: any = await this.usersRepository.findByLogin(
      loginBody.loginOrEmail,
    );
    if (!user || user.isBanned === true) {
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'login' }] },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const deviceId = v4();
    const isItHash = await this._correctHash(
      loginBody.password,
      user.passwordHash,
    );
    if (!isItHash) {
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'password' }] },
        HttpStatus.UNAUTHORIZED,
      );
    } else {
      const tokens = await this.createTokens(user.id, user.login, deviceId);

      const payloadInfo: any = this._extractPayload(tokens.refreshToken);

      const iat = new Date(payloadInfo.iat * 1000);
      const exp = new Date(payloadInfo.exp * 1000);
      const newDevice = {
        deviceId: deviceId,
        ip: ip,
        title: title,
        lastActiveDate: iat,
        expiredDate: exp,
        userId: user.id,
      };
      await this.deviceRepository.addDevices(newDevice);
      return {
        resultCode: 0,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };
    }
  }

  async _generateHash(password: string) {
    return bcrypt.hash(password, 10);
  }

  async _correctHash(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  async createTokens(userId, userLogin, deviceId) {
    const secret = this.configService.get('JWT_SECRET_KEY');
    const accessToken = jwt.sign(
      { userId: userId, userLogin: userLogin },
      secret,
      {
        expiresIn: '10h',
      },
    );
    const refreshToken = jwt.sign(
      { userId: userId, userLogin: userLogin, deviceId: deviceId },
      secret,
      { expiresIn: '20h' },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateDevice(refreshToken: string) {
    const payload: any = this._extractPayload(refreshToken);
    if (!payload) return null;
    const iat = new Date(payload.iat * 1000);
    const session = await this.deviceRepository.findDeviceById(
      payload.userId,
      payload.deviceId,
      iat,
    );
    if (!session) return null;
    const tokens = await this.createTokens(
      payload.userId,
      payload.userLogin,
      payload.deviceId,
    );
    const newPayloadInfo: any = this._extractPayload(tokens.refreshToken);
    const newIat = new Date(newPayloadInfo.iat * 1000);
    const newExp = new Date(newPayloadInfo.exp * 1000);
    await this.deviceRepository.updateDevices(
      newPayloadInfo.userId,
      newPayloadInfo.deviceId,
      newExp,
      newIat,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async removeSession(token: string) {
    const payload: any = this._extractPayload(token);
    if (!payload) return null;
    const iat = new Date(payload.iat * 1000);
    const validDevice = await this.deviceRepository.findDeviceById(
      payload.userId,
      payload.deviceId,
      iat,
    );
    if (!validDevice) return null;
    const result = await this.deviceRepository.removeSession(
      payload.userId,
      payload.deviceId,
    );
    return result;
  }

  _extractPayload(refreshToken: string) {
    try {
      const secret = this.configService.get('JWT_SECRET_KEY');
      return jwt.verify(refreshToken, secret);
    } catch (e) {
      console.log(e);
    }
  }
}
