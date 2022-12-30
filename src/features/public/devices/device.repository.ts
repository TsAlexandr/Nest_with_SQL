import { Device } from '../../../common/types/schemas/schemas.model';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DeviceRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findAllDevice(userId: string) {
    const query = await this.dataSource.query(
      `
    SELECT ip, title, "lastActiveDate", "deviceId" 
    FROM public.devices
    WHERE "userId" = $1`,
      [userId],
    );
    return query[0];
  }

  async addDevices(newDevice: Device) {
    const query = await this.dataSource.query(
      `
    INSERT INTO public.devices 
    ("userId", "deviceId", ip, title, "lastActiveDate", "expiredAt")
    VALUES 
    ($1, $2, $3, $4, $5, $6)
    RETURNING ip, title, "lastActiveDate", "deviceId"`,
      [
        newDevice.userId,
        newDevice.deviceId,
        newDevice.ip,
        newDevice.title,
        newDevice.lastActiveDate,
        newDevice.expiredDate,
      ],
    );
    return query;
  }

  async deleteAllDevice(userId: string, deviceId: string) {
    return this.dataSource.query(
      `
    DELETE FROM public.devices
    WHERE "userId" = $1 AND "deviceId" != $2`,
      [userId, deviceId],
    );
  }

  async findDeviceById(userId: string, deviceId: string, date: Date) {
    const query = await this.dataSource.query(
      `
    SELECT * FROM public.devices
    WHERE "userId" = $1 AND "deviceId" = $2 AND "lastActiveDate" = $3`,
      [userId, deviceId, date],
    );
    return query[0];
  }

  async updateDevices(
    userId: string,
    deviceId: string,
    expDate: Date,
    lastActive: Date,
  ) {
    return this.dataSource.query(
      `
    UPDATE public.devices
    SET "expiredAt" = $1, "lastActiveDate" = $2
    WHERE "userId" = $3 AND "deviceId" = $4`,
      [expDate, lastActive, userId, deviceId],
    );
  }

  async removeSession(userId: string, deviceId: string) {
    return this.dataSource.query(
      `
    DELETE FROM public.devices
    WHERE "userId" = $1 AND "deviceId" = $2
    `,
      [userId, deviceId],
    );
  }

  async getDeviceById(deviceId: string) {
    const query = await this.dataSource.query(
      `
    SELECT * FROM public.devices
    WHERE "deviceId" = $1`,
      [deviceId],
    );
    return query[0];
  }
}
