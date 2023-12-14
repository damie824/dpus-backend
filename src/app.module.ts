import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmConfigService } from './providers/database/typeorm.service';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './common/mail/mail.module';
import { BambooModule } from './common/bamboo/bamboo.module';
@Module({
  imports: [
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
  providers: [AppService],
})
export class AppModule {}
