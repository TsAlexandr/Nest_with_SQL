import { Device } from '../../../common/types/schemas/schemas.model';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DeviceEntity } from './entities/device.entity';

@Injectable()
export class DeviceRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findAllDevice(userId: string) {
    const query = await this.dataSource
      .getRepository(DeviceEntity)
      .createQueryBuilder()
      .where('userId = :userId', { userId })
      .getRawMany();
    return query;
  }

  async addDevices(newDevice: Device) {
    const query = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(DeviceEntity)
      .values({
        userId: newDevice.userId,
        deviceId: newDevice.deviceId,
        ip: newDevice.ip,
        title: newDevice.title,
        lastActiveDate: newDevice.lastActiveDate,
        expiredAt: newDevice.expiredDate,
      })
      .returning(['ip', 'title', 'lastActiveDate', 'deviceId'])
      .execute();
    return query;
  }

  async deleteAllDevice(userId: string, deviceId: string) {
    return this.dataSource
      .createQueryBuilder()
      .delete()
      .from(DeviceEntity)
      .where('userId = :userId', { userId })
      .andWhere('deviceId != :deviceId', { deviceId })
      .execute();
  }

  async findDeviceById(userId: string, deviceId: string, date: Date) {
    const query = await this.dataSource
      .getRepository(DeviceEntity)
      .createQueryBuilder()
      .where('userId = :userId', { userId })
      .andWhere('deviceId = :deviceId', { deviceId })
      .andWhere('lastActiveDate = :lastActiveDate', { date })
      .getRawOne();
    return query;
  }

  async updateDevices(
    userId: string,
    deviceId: string,
    expDate: Date,
    lastActive: Date,
  ) {
    return this.dataSource
      .createQueryBuilder()
      .update(DeviceEntity)
      .set({ expiredAt: expDate, lastActiveDate: lastActive })
      .where('userId = :userId', { userId })
      .andWhere('deviceId = :deviceId', { deviceId })
      .execute();
  }

  async removeSession(userId: string, deviceId: string) {
    return this.dataSource
      .createQueryBuilder()
      .delete()
      .from(DeviceEntity)
      .where('userId = :userId', { userId })
      .andWhere('deviceId = :deviceId', { deviceId })
      .execute();
  }

  async getDeviceById(deviceId: string) {
    const query = await this.dataSource
      .getRepository(DeviceEntity)
      .createQueryBuilder()
      .where('deviceId = :deviceId', { deviceId })
      .getRawOne();
    return query;
  }
}
