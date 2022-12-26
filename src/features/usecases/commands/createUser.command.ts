import { CreateUserDto } from '../../sa/users/dto/create-user.dto';

export class CreateUserCommand {
  constructor(public readonly createUser: CreateUserDto) {}
}
