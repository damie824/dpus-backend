import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BambooService } from './bamboo.service';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import { PostBambooDto } from './dto/upload.dto';
import { Request } from 'express';
import { CommentBambooDto } from './dto/comment.dto';
import { LikeBambooDto } from './dto/like.dto';

@Controller('bamboo')
export class BambooController {
  constructor(private readonly bambooService: BambooService) {}

  @Get('/:page')
  async getAll(@Param('page') page: number) {
    return this.bambooService.getAll(page);
  }

  @Get('/post/:id')
  async getPost(@Param('id') id: number) {
    return this.bambooService.getBamboo(id);
  }

  @Post('/upload')
  @UseGuards(AuthGuard)
  async uploadBamboo(@Body() uploadDto: PostBambooDto, @Req() req: Request) {
    const user = req.user;
    return await this.bambooService.uploadPost(uploadDto, user.id);
  }

  @Post('/comment')
  @UseGuards(AuthGuard)
  async commentBamboo(
    @Body() commentDto: CommentBambooDto,
    @Req() req: Request,
  ) {
    const user = req.user;

    return await this.bambooService.commentBamboo(commentDto, user.id);
  }

  @Get('/like/:id')
  @UseGuards(AuthGuard)
  async likeBamboo(@Body() likeBambooDto: LikeBambooDto, @Req() req: Request) {
    const user = req.user;
    return this.bambooService.like(likeBambooDto, user.id);
  }
}
