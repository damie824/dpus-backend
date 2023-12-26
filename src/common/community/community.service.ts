import {
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommunityPost } from 'src/modules/Community/post.entity';
import { PostUploadDto } from './dto/upload.dto';
import { NewCategoryDto } from './dto/newCategoryDto';
import { User } from 'src/modules/User/user.entity';
import { CommunityCategory } from 'src/modules/Community/category.entity';
import { CommunityComments } from 'src/modules/Community/comments.entity';

export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  constructor(private dataSource: DataSource) {}

  // 시간을 "1일 전", "1주일 전", "1달 전" 등으로 변환하는 메소드
  getTimeAgo(time: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - time.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let timeAgo: string;

    if (diffMinutes < 2) {
      timeAgo = '방금 전';
    } else if (diffMinutes < 60) {
      timeAgo = `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      timeAgo = `${diffHours}시간 전`;
    } else if (diffDays < 2) {
      timeAgo = '1일 전';
    } else if (diffDays < 8) {
      timeAgo = `${diffDays}일 전`;
    } else if (diffDays < 31) {
      timeAgo = `${Math.floor(diffDays / 7)}주일 전`;
    } else {
      timeAgo = `${Math.floor(diffDays / 30)}달 전`;
    }

    return timeAgo;
  }

  // 모든 게시물을 가져오는 메소드
  async getAll(page: number): Promise<CommunityPost[]> {
    this.logger.log('getAll 메소드 호출');
    const postRepository = this.dataSource.getRepository(CommunityPost);
    let posts = await postRepository.find({
      order: {
        createdAt: 'desc',
      },
      take: 8,
      skip: page * 8,
    });

    posts = posts.map((post) => {
      const timeAgo = this.getTimeAgo(post.createdAt);
      return { ...post, timeAgo };
    });

    return posts;
  }

  // 특정 카테고리의 게시물을 가져오는 메소드
  async getCategoryPost(
    categoryId: number,
    page: number,
  ): Promise<CommunityPost[]> {
    this.logger.log('getCategoryPost 메소드 호출');
    const postRepository = this.dataSource.getRepository(CommunityPost);
    let posts = await postRepository.find({
      where: {
        category: {
          id: categoryId,
        },
      },
      order: {
        createdAt: 'desc',
      },
      take: 8,
      skip: page * 8,
    });

    posts = posts.map((post) => {
      const timeAgo = this.getTimeAgo(post.createdAt);
      return { ...post, timeAgo };
    });

    return posts;
  }

  async getPost(id: number) {
    const postRepository = this.dataSource.getRepository(CommunityPost);
    const commentRepository = this.dataSource.getRepository(CommunityComments);

    const post = postRepository.findOneBy({
      id,
    });

    const comments = commentRepository.find({
      where: {
        post: {
          id,
        },
      },
    });

    if (!post) {
      throw new NotFoundException("Couldn't find post.");
    }
  }

  // 새로운 카테고리를 생성하는 메소드
  async generateCategory(
    userAuthority: number,
    newCategoryDto: NewCategoryDto,
  ) {
    if (userAuthority < 9) {
      this.logger.warn('User tried ti generate new category, but failed.');
      throw new UnauthorizedException('Insufficient user permissions.');
    }

    const categoryRepository = this.dataSource.getRepository(CommunityCategory);
    const newCategory = categoryRepository.create({
      title: newCategoryDto.title,
      description: newCategoryDto.desc,
    });

    categoryRepository.save(newCategory);
    this.logger.log('New category generated : ' + newCategory.title);

    return { message: 'success' };
  }

  // 새로운 게시물을 업로드하는 메소드
  async uploadPost(userId: number, postUploadDto: PostUploadDto) {
    this.logger.log('uploadPost 메소드 호출');
    try {
      const userRepository = this.dataSource.getRepository(User);
      const postRepository = this.dataSource.getRepository(CommunityPost);
      const categoryRepository =
        this.dataSource.getRepository(CommunityCategory);

      const category = await categoryRepository.findOneBy({
        id: postUploadDto.categoryId,
      });

      const author = await userRepository.findOneBy({
        id: userId,
      });
      const newPost = postRepository.create({
        title: postUploadDto.title,
        contents: postUploadDto.contents,
        createdAt: new Date(),
        category,
        author,
      });

      await postRepository.save(newPost);

      return { message: 'success' };
    } catch (error) {
      this.logger.warn('uploadPost 메소드에서 에러 발생', error.message);
      throw new InternalServerErrorException(error.message);
    }
  }
}
