import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Supabase } from 'src/providers/supabase/supabase';
import { LostUploadDto } from './dto/upload.dto';
import parseDataURL from 'data-urls';
import { DataSource } from 'typeorm';
import { LostPost } from 'src/modules/lost/post.entity';

@Injectable()
export class LostService {
  private readonly logger = new Logger();
  constructor(
    private readonly supabase: Supabase,
    private readonly dataSource: DataSource,
  ) {}

  async upload(lostUploadDto: LostUploadDto) {
    const supabaseClient = this.supabase.getClient();
    const postRepository = this.dataSource.getRepository(LostPost);

    const dataUrl = await parseDataURL(lostUploadDto.thumbnail);
    const type: string = dataUrl.mimeType.toString();

    const fileExtension = type.split('/')[1];

    const fileName = `/${Date.now()}.${fileExtension}`;

    const { data, error } = await supabaseClient.storage
      .from('lost')
      .upload(fileName, dataUrl.body, {
        contentType: type,
      });

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(error.message);
    }
  }
}
