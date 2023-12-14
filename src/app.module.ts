import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmConfigService } from './providers/database/typeorm.service';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, NestApplication } from '@nestjs/core';
import { MailModule } from './common/mail/mail.module';
import { BambooModule } from './common/bamboo/bamboo.module';
import cookieParser from 'cookie-parser';
import { AuthGuard } from './auth/guards/auth.guards';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from './auth/config/jwt.config.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
      inject: [ConfigService],
      global: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),
    AuthModule,
    MailModule,
    BambooModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
