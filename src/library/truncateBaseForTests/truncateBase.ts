import { Controller, Delete, HttpCode } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class TestRepo {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async removeAllData() {
    await this.dataSource.query(`DELETE FROM public.users`);
    await this.dataSource.query(`DELETE FROM public."banInfo"`);
    await this.dataSource.query(`DELETE FROM public.blogs`);
    await this.dataSource.query(`DELETE FROM public.devices`);
  }
}

@Controller('testing')
export class TruncateBase {
  constructor(private testRepo: TestRepo) {}

  @HttpCode(204)
  @Delete('/all-data')
  async dropData() {
    await this.testRepo.removeAllData();
    return;
  }
}
