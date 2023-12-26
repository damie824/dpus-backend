import { IsNotEmpty } from 'class-validator';

export class PostUploadDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  categoryId: number;

  @IsNotEmpty()
  contents: string;
}
