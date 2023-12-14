import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailCert } from 'src/modules/User/email.entity';
import { DataSource } from 'typeorm';
import { GetCodeDto } from './dto/get-code.dto';
import { VerifyDto } from './dto/verify.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger();
  constructor(
    private readonly mailerService: MailerService,
    private readonly dataSource: DataSource,
  ) {}

  async sendVerifyCode(mailTo: string, code: number) {
    try {
      await this.mailerService
        .sendMail({
          to: mailTo,
          from: 'dpus.noreply@gmail.com',
          subject: '[DPUS] 이메일을 인증해 주세요.',
          html: `<table
          width="100%"
          border="0"
          cellpadding="0"
          cellspacing="0"
        >
          <tr>
            <td style="width: 100%">
              <img
                align="center"
                border="0"
                src="https://jtyebkumzywcvsnkcwki.supabase.co/storage/v1/object/sign/logo/logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJsb2dvL2xvZ28ucG5nIiwiaWF0IjoxNzAyNDgxODE4LCJleHAiOjg2NDE3MDIzOTU0MTh9.zuArXtBJfrOsieKiZ2hIJ-XuGMV2kfM8plKZ9V_TOJs&t=2023-12-13T15%3A36%3A58.343Z"
                alt="Image"
                title="Image"
                style="
                  border: 0px;
                  height: auto;
                  width: 100px;
                  display: block;
                  margin: 30px auto;
                "
              />
            </td>
          </tr>
          <tr style="padding: 20px; height: 50px">
            <td style="width: 80%; font-size: 12px; text-align: center">
              <p>아래 번호를 입력해 이메일 인증을 완료하세요!</p>
            </td>
          </tr>
          <tr style="text-align: center; margin-top: 20px">
            <td style="width: 100%; padding: 0 20px; font-size: 13px">
              <h2>${code}</h2>
            </td>
          </tr>
          <tr>
            <td>
              <p style="text-align: center; font-size: 10px; opacity: 60%">
                이 메일이 왜 온지 모르시겠다면, 무시해 주세요!
              </p>
            </td>
            <td style="height: 50px"></td>
          </tr>
        </table>
        `,
        })
        .then((result) => {
          return { message: 'done' };
        });
    } catch (error) {
      this.logger.warn(error.message);
    }

    return { mesage: 'worked' };
  }

  async createRandomNumb() {
    const random = Math.floor(Math.random() * (100000 - 999999 + 1)) + 999999;
    return random;
  }

  async setVerifyNumb(
    getCodeDto: GetCodeDto,
  ): Promise<{ message: string; generated: boolean }> {
    const certRepository = this.dataSource.getRepository(EmailCert);
    const certCode = await this.createRandomNumb();

    await this.sendVerifyCode(getCodeDto.email, certCode);

    const foundCert = await certRepository.findOneBy({
      email: getCodeDto.email,
    });

    if (foundCert) {
      if (foundCert.verified) {
        throw new BadRequestException('Email already taken');
      }
      await certRepository.delete({
        email: getCodeDto.email,
      });
    }

    const newCert = certRepository.create({
      email: getCodeDto.email,
      certNumb: `${certCode}`,
    });

    await certRepository.save(newCert);
    return {
      message: 'successed',
      generated: true,
    };
  }

  async verifyCode(verifyDto: VerifyDto): Promise<{ verified: boolean }> {
    try {
      const certRepository = this.dataSource.getRepository(EmailCert);
      const found = await certRepository.findOneBy({
        email: verifyDto.email,
      });

      if (!found) {
        throw new ConflictException('Email not found');
      }

      if (found.certNumb != verifyDto.code) {
        throw new UnauthorizedException('Code not matched');
      }

      if (found.verified) {
        throw new ConflictException('Email already verified');
      }

      await certRepository.update(
        { email: verifyDto.email },
        { verified: true },
      );

      return { verified: true };
    } catch (err) {
      this.logger.warn(err.message);
    }
  }
}
