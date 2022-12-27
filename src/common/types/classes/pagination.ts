import { SortOrder } from 'mongoose';

export class Pagination {
  static getPaginationData(query) {
    const page = typeof query.pageNumber === 'string' ? +query.pageNumber : 1;
    const pageSize = typeof query.pageSize === 'string' ? +query.pageSize : 10;
    const searchNameTerm =
      typeof query.searchNameTerm === 'string' ? query.searchNameTerm : '';
    const sortBy =
      typeof query.sortBy === 'string' ? query.sortBy : 'createdAt';
    const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC';
    return { page, pageSize, searchNameTerm, sortBy, sortDirection };
  }

  static getData(query) {
    const page = typeof query.pageNumber === 'string' ? +query.pageNumber : 1;
    const pageSize = typeof query.pageSize === 'string' ? +query.pageSize : 10;
    const sortBy =
      typeof query.sortBy === 'string' ? query.sortBy : 'createdAt';
    const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC';
    return { page, pageSize, sortBy, sortDirection };
  }

  static getPaginationDataForUser(query) {
    const page = typeof query.pageNumber === 'string' ? +query.pageNumber : 1;
    const pageSize = typeof query.pageSize === 'string' ? +query.pageSize : 10;
    const searchLoginTerm =
      typeof query.searchLoginTerm === 'string' ? query.searchLoginTerm : '';
    const searchEmailTerm =
      typeof query.searchEmailTerm === 'string' ? query.searchEmailTerm : '';
    const sortBy =
      typeof query.sortBy === 'string' ? query.sortBy : 'createdAt';
    const banStatus =
      query.banStatus === 'banned'
        ? [true]
        : query.banStatus === 'notBanned'
        ? [false]
        : [true, false];
    const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC';
    return {
      page,
      pageSize,
      searchLoginTerm,
      searchEmailTerm,
      sortBy,
      sortDirection,
      banStatus,
    };
  }
}
