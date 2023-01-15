import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtExtract } from '../auth/guards/jwt.extract';
import { DeviceService } from './device.service';
import { Cookies } from '../../../common/custom-decorator/current.user.decorator';

@Controller('security/devices')
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  @UseGuards(JwtExtract)
  @Get()
  async getDevice(@Cookies() cookies) {
    if (!cookies) {
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'refreshToken' }] },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.deviceService.getDevices(cookies);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async deleteAllDevice(@Cookies() cookies) {
    if (!cookies) {
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'refreshToken' }] },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.deviceService.deleteDevices(cookies);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':deviceId')
  async deleteDeviceById(
    @Param('deviceId') deviceId: string,
    @Cookies() cookies,
  ) {
    return this.deviceService.deleteById(cookies, deviceId);
  }
}
