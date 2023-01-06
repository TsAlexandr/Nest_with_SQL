import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlogsService } from '../../blogs/blogs.service';

@Injectable()
export class ExistingBlogGuard implements CanActivate {
  constructor(private blogsService: BlogsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> | null {
    const request = context.switchToHttp().getRequest();
    const id = request.params.blogId;
    const userId = request.user.userId;
    const blog = await this.blogsService.validateBlogId(id);
    if (!blog)
      throw new NotFoundException({
        message: 'blog not found',
        field: 'blogId',
      });
    if (blog.userId !== userId) throw new ForbiddenException();
    return true;
  }
}
