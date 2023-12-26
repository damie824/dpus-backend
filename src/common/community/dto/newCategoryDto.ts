import { IsNotEmpty } from 'class-validator';

export class NewCategoryDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  desc: string;
}
