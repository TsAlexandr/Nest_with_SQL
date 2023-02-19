import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryTopUsersDto } from '../dto/query-top-users';

export class GetUsersTop {
  constructor(public readonly query: QueryTopUsersDto) {}
}

@QueryHandler(GetUsersTop)
export class GetUsersTopHandler implements IQueryHandler<GetUsersTop> {
  execute(query: GetUsersTop): Promise<any> {
    return Promise.resolve(undefined);
  }
}
