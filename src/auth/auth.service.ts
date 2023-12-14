import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from 'src/modules/User/user.entity';
import * as bcrypt from 'bcrypt';
import RegisterDto from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private logger = new Logger();
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async registerUser(registerDto: RegisterDto): Promise<User> {
    try {
      const userRepository = this.dataSource.getRepository(User);
      let foundUser = await userRepository.findOneBy({
        email: registerDto.email,
      });

      if (foundUser) {
        throw new ConflictException('Email already used.');
      }

      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);

      const passwordHashed = await bcrypt.hash(registerDto.password, salt);

      const newUser = userRepository.create({
        email: registerDto.email,
        username: registerDto.username,
        password: passwordHashed,
      });
      userRepository.save(newUser);

      return newUser;
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(error.message);
    }
  }

  async validateUser(loginDto: LoginDto): Promise<User> {
    const userRepository = this.dataSource.getRepository(User);
    let foundUser = await userRepository.findOneBy({
      email: loginDto.email,
    });

    if (!foundUser) {
      throw new UnauthorizedException('User not found');
    }

    const validatePassword = await bcrypt.compare(
      loginDto.password,
      foundUser.password,
    );

    if (!validatePassword) {
      throw new UnauthorizedException('password not matched');
    }

    return foundUser;
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload: payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      authority: user.role ? user.role.authority : 0,
    };
    return this.jwtService.signAsync(payload);
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload: payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      authority: user.role ? user.role.authority : 0,
    };

    return this.jwtService.signAsync(
      { id: payload.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION_TIME',
        ),
      },
    );
  }

  async getCurrentHashedRefreshToken(refreshToken: string) {
    const saltOrRounds = 10;
    const currentRefreshToken = await bcrypt.hash(refreshToken, saltOrRounds);
    return currentRefreshToken;
  }

  async getCurrentRefreshTokenExp(): Promise<Date> {
    const currentDate = new Date();
    const currentRefreshTokenExp = new Date(
      currentDate.getTime() +
        parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME')),
    );

    return currentRefreshTokenExp;
  }

  async setCurrentRefreshToken(refreshToken: string, userId: number) {
    const userRepository = this.dataSource.getRepository(User);

    const currentRefreshToken =
      await this.getCurrentHashedRefreshToken(refreshToken);
    const currentRefreshTokenExp = await this.getCurrentRefreshTokenExp();
    await userRepository.update(userId, {
      currentRefreshToken: currentRefreshToken,
      currentRefreshTokenExp: currentRefreshTokenExp,
    });
  }

  async tokenValidateUser(payload: payload): Promise<User | undefined> {
    const userRepository = this.dataSource.getRepository(User);

    const user = await userRepository.findOneBy({
      id: payload.id,
    });

    return user;
  }

  async refresh(refreshDto: RefreshTokenDto) {
    const { refresh_token } = refreshDto;

    const decodedRefreshToken = this.jwtService.verify(refresh_token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const userId = decodedRefreshToken.id;
    const user = await this.getUserIfRefreshTokenMatches(refresh_token, userId);

    if (!user) {
      throw new UnauthorizedException('Invalid user!');
    }

    const accessToken = await this.generateAccessToken(user);

    return { accessToken };
  }

  async getUserIfRefreshTokenMatches(
    refreshToken: string,
    userId: number,
  ): Promise<User> {
    const userRepository = this.dataSource.getRepository(User);
    const user: User = await userRepository.findOneBy({
      id: userId,
    });

    if (!user.currentRefreshToken) {
      return null;
    }

    const isRefreshMatch = await bcrypt.compare(
      refreshToken,
      user.currentRefreshToken,
    );

    if (isRefreshMatch) {
      return user;
    }
  }

  async removeRefreshToken(userId: number): Promise<any> {
    const userRepository = this.dataSource.getRepository(User);
    return await userRepository.update(userId, {
      currentRefreshToken: null,
      currentRefreshTokenExp: null,
    });
  }
}
