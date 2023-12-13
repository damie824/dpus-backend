import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Meals {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string;

  @Column()
  data: string;
}
