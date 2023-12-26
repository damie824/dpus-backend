import { IsNotEmpty } from 'class-validator';

export class LostUploadDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  contents: string;

  location: string;

  thumbnail: string;
}
