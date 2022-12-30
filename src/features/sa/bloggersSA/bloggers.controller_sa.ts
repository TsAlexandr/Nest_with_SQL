import { Paginator } from '../../../common/types/classes/classes';
import { Pagination } from '../../../common/types/classes/pagination';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from '../../public/blogs/blogs.service';
import { BasicGuards } from '../../public/auth/guards/basic.guards';
import { BloggersMongo } from '../../../common/types/schemas/schemas.model';
import { CommandBus } from '@nestjs/cqrs';
import { BanBlogByIdCommand } from '../../usecases/commands/banBlogById.command';

@UseGuards(BasicGuards)
@Controller('sa/blogs')
export class SuperBlogsController {
  constructor(
    private bloggersService: BlogsService,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getAllBloggers(@Query() query): Promise<Paginator<BloggersMongo[]>> {
    const { page, pageSize, searchNameTerm, sortBy, sortDirection } =
      Pagination.getPaginationData(query);
    const bloggers = await this.bloggersService.getBlogsWithOwnerInfo(
      page,
      pageSize,
      searchNameTerm,
      sortBy,
      sortDirection,
    );
    if (!bloggers) {
      throw new NotFoundException();
    }
    return bloggers;
  }
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id/ban')
  async banBlog(@Param('id') id: string, @Body('isBanned') isBanned: boolean) {
    return this.commandBus.execute(new BanBlogByIdCommand(id, isBanned));
  }
}
