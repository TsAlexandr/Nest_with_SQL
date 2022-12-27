import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BasicGuards } from '../../public/auth/guards/basic.guards';
import { Pagination } from '../../../common/types/classes/pagination';
import { BanUserDto } from './dto/banUser.dto';
import { CommandBus } from '@nestjs/cqrs';
import { BanUserCommand } from '../../usecases/commands/banUser.command';
import { CreateUserCommand } from '../../usecases/commands/createUser.command';

@UseGuards(BasicGuards)
@Controller('sa/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getAll(@Query() query) {
    const {
      page,
      pageSize,
      searchLoginTerm,
      searchEmailTerm,
      sortBy,
      sortDirection,
      banStatus,
    } = Pagination.getPaginationDataForUser(query);
    return await this.usersService.getAllUsers(
      page,
      pageSize,
      searchLoginTerm,
      searchEmailTerm,
      sortBy,
      sortDirection,
      banStatus,
    );
  }

  @Post()
  async create(@Body() createUser: CreateUserDto) {
    return this.commandBus.execute(new CreateUserCommand(createUser));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id/ban')
  async banUser(@Param('id') userId: string, @Body() banInfo: BanUserDto) {
    await this.commandBus.execute(new BanUserCommand(userId, banInfo));
    return true;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  async delete(@Param('id') id: string) {
    const user = await this.usersService.findUserById(id);
    if (!user)
      throw new HttpException(
        { message: [{ message: 'invalid value', field: 'deviceId' }] },
        HttpStatus.NOT_FOUND,
      );
    return await this.usersService.deleteUser(id);
  }
}
