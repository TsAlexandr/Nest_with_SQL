import { BloggersDto } from '../../features/public/blogs/dto/bloggers.dto';
import { Blogger, Paginator } from '../classes/classes';

export interface IBlogsRepository {
  getBloggers(
    page: number,
    pageSize: number,
    searchNameTerm: string,
    sortBy: string,
    sortDirection: number,
  ): Promise<Paginator<Blogger[]>>;

  getBloggersById(id: string): Promise<Blogger>;

  createBlogger(newBlogger: {
    websiteUrl: string;
    name: string;
    id: string;
  }): Promise<Blogger>;

  updateBloggerById(id: string, update: BloggersDto): Promise<boolean>;

  deleteBloggerById(id: string): Promise<boolean>;

  bindWithUser(blogId: string, userId: string): any;
}
