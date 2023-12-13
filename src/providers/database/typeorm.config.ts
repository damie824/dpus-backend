import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeORMConfig: TypeOrmModuleOptions = {
  //데이터베이스 설정
  type: 'postgres',
  name: process.env.DATABASE_NAME,
  host: process.env.DATABASE_URL,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  //엔티티 로드
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  //데이터 동기화 설정
  synchronize: true,
};
