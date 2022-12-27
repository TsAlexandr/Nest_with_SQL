import { Controller, Delete, HttpCode } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsersRepository } from '../../features/sa/users/users.repository';

export class TestRepo {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private usersRepository: UsersRepository,
  ) {}

  async removeAllData() {
    console.log('here');
    await this.usersRepository.deleteAll();
    await this.dataSource.query(`DELETE FROM public.users`);
    await this.dataSource.query(`DELETE FROM public.blogs`);
    await this.dataSource.query(`DELETE FROM public.devices`);
  }
}

@Controller('testing/all-data')
export class TruncateBase {
  constructor(private testRepo: TestRepo) {}

  @HttpCode(204)
  @Delete()
  async dropData() {
    await this.testRepo.removeAllData();
    return;
  }
}
