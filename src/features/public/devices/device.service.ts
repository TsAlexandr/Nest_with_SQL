import { DeviceRepository } from './device.repository';
import * as jwt from 'jsonwebtoken';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeviceService {
  constructor(
    private deviceRepository: DeviceRepository,
    private configService: ConfigService,
  ) {}

  async getDevices(refreshToken: string) {
    const payload: any = this._extractPayload(refreshToken);
    return this.deviceRepository.findAllDevice(payload.userId);
  }

  async deleteDevices(refreshToken: string) {
    const payload: any = this._extractPayload(refreshToken);
    if (!payload)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'refreshToken' }] },
        HttpStatus.UNAUTHORIZED,
      );
    return this.deviceRepository.deleteAllDevice(
      payload.userId,
      payload.deviceId,
    );
  }

  async deleteById(refreshToken: string, deviceId: string) {
    const payload: any = this._extractPayload(refreshToken);
    if (!payload)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'refreshToken' }] },
        HttpStatus.UNAUTHORIZED,
      );
    const device = await this.deviceRepository.getDeviceById(deviceId);
    if (!device)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'deviceId' }] },
        HttpStatus.NOT_FOUND,
      );
    if (payload.userId !== device.userId)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'refreshToken' }] },
        HttpStatus.FORBIDDEN,
      );
    return this.deviceRepository.removeSession(payload.userId, deviceId);
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
