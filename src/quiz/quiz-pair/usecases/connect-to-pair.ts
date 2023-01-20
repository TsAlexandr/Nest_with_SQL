import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../features/sa/users/users.repository';

export class ConnectToPairCommand {
  constructor(public readonly userId: string) {}
}

@CommandHandler(ConnectToPairCommand)
export class ConnectToPairHandler
  implements ICommandHandler<ConnectToPairCommand>
{
  constructor(private userRepo: UsersRepository) {}
  execute(command: ConnectToPairCommand): Promise<any> {
    return Promise.resolve(undefined);
  }
}
