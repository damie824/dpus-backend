import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PostBambooDto } from './dto/upload.dto';
import { User } from 'src/modules/User/user.entity';
import { BambooPost } from 'src/modules/bamboo/post.entity';
import { CommentBambooDto } from './dto/comment.dto';
import { BambooComments } from 'src/modules/bamboo/comments.entity';
import { LikeBambooDto } from './dto/like.dto';
import { BambooCommentsLike } from 'src/modules/bamboo/comments-like.entity';
import { BambooLike } from 'src/modules/bamboo/like.entity';

@Injectable()
export class BambooService {
  private logger = new Logger();
  constructor(private readonly dataSource: DataSource) {}

  async getAll(pageNumb: number): Promise<BambooPost[]> {
    const bambooRepository = this.dataSource.getRepository(BambooPost);
    const bamboos = await bambooRepository.find({
      skip: pageNumb * 8,
      take: 8,
    });
    return bamboos;
  }

  async getBamboo(id: number) {
    const bambooRepository = this.dataSource.getRepository(BambooPost);
    const userRepository = this.dataSource.getRepository(User);
    const commentRepository = this.dataSource.getRepository(BambooComments);
    const likeRepository = this.dataSource.getRepository(BambooLike);

    let currentBamboo = await bambooRepository.findOneBy({
      id,
    });

    let currentuser = 0;

    if (!currentBamboo.anonymity) {
      const foundUser = await userRepository.findOneBy({
        id: currentBamboo.author?.id,
      });
      currentuser = foundUser.id;
    }

    const comments = await commentRepository.find({
      relations: {
        post: true,
      },
      where: {
        post: {
          id: currentBamboo.id,
        },
      },
    });

    const likes = await likeRepository.countBy({
      post: {
        id: currentBamboo.id,
      },
    });

    await bambooRepository.update(
      { id: id },
      {
        viewd: currentBamboo.viewd + 1,
      },
    );
    return { ...currentBamboo, user: currentuser, comments, likes };
  }

  async uploadPost(
    uploadDto: PostBambooDto,
    userId: number,
  ): Promise<{ message: string }> {
    try {
      const userRepository = this.dataSource.getRepository(User);
      const bambooRepository = this.dataSource.getRepository(BambooPost);

      const author = await userRepository.findOneBy({
        id: userId,
      });

      const newPost = bambooRepository.create({
        title: uploadDto.title,
        contents: uploadDto.contents,
        createdAt: new Date(),
        author: author,
        anonymity: uploadDto.anonymity,
      });

      bambooRepository.save(newPost);

      return { message: 'done.' };
    } catch (error) {
      this.logger.warn(error.message);
    }
  }

  async commentBamboo(
    commentBambooDto: CommentBambooDto,
    userId: number,
    parent?: number,
  ): Promise<{ message: string }> {
    try {
      const bambooRepository = this.dataSource.getRepository(BambooPost);
      const commentRepository = this.dataSource.getRepository(BambooComments);
      const userRepository = this.dataSource.getRepository(User);

      const author = await userRepository.findOneBy({
        id: userId,
      });

      if (!author) {
        throw new ConflictException('User not found');
      }

      const currentPost = await bambooRepository.findOneBy({
        id: commentBambooDto.postId,
      });

      const newComment = commentRepository.create({
        post: currentPost,
        contents: commentBambooDto.contents,
        parents: !parent ? null : parent,
      });

      await commentRepository.save(newComment);

      return { message: 'done' };
    } catch (error) {
      this.logger.warn(error.message);
    }
  }

  async like(
    likeDto: LikeBambooDto,
    userId: number,
  ): Promise<{ message: string }> {
    try {
      const userRepository = this.dataSource.getRepository(User);
      const likeRepository = this.dataSource.getRepository(BambooLike);
      const postRepository = this.dataSource.getRepository(BambooPost);

      const foundUser = await userRepository.findOneBy({
        id: userId,
      });

      const foundPost = await postRepository.findOneBy({
        id: likeDto.postId,
      });

      const foundLike = await likeRepository.findOneBy({
        post: foundPost,
        author: foundUser,
      });

      let newLike = undefined;

      if (foundLike) {
        newLike = await likeRepository.delete({ id: foundLike.id });
      } else {
        newLike = likeRepository.create({
          author: foundUser,
          post: foundPost,
        });
        await likeRepository.save(newLike);
      }

      return { message: 'done' };
    } catch (error) {
      this.logger.warn(error.message);
    }
  }
}
