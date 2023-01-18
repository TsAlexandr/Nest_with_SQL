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
    await this.usersRepository.deleteAll();
  }
}

@Controller('testing/all-data')
export class TruncateBase {
  constructor(private testRepo: TestRepo) {}

  @HttpCode(204)
  @Delete()
  async truncateBase() {
    await this.testRepo.removeAllData();
    return;
  }
}
