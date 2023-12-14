import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BambooService } from './bamboo.service';
import { AuthGuard } from 'src/auth/guards/auth.guards';
import { PostBambooDto } from './dto/upload.dto';
import { Request } from 'express';

@Controller('bamboo')
export class BambooController {
  W;
  constructor(private readonly bambooService: BambooService) {}

  @Post('/upload')
  @UseGuards(AuthGuard)
  async uploadBamboo(@Body() uploadDto: PostBambooDto, @Req() req: Request) {
    const user = req.user;

    await this.bambooService.uploadPost(uploadDto, user.id);
  }

  @Get('/post/:id')
  async getPost(@Query('id') id: number) {
    this.bambooService.getBamboo(id);
  }
}
