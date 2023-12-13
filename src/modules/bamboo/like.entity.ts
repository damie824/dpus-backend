import {
  Entity,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BambooPost } from './post.entity';
import { User } from '../User/user.entity';

@Entity()
export class BambooLike {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => BambooPost, (post) => post.like)
  post: BambooPost;

  @OneToMany(() => User, (user) => user.bambooLike)
  author: User;
}
