import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

/**
 * Отправка писем.
 *
 * Если задан SMTP_URL — письма уходят через него. Если нет (обычный режим
 * разработки), письмо не отправляется, а ссылка пишется в лог: так поток
 * регистрации проверяется без почтового сервера.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const smtpUrl = this.config.get<string>('SMTP_URL');
    this.transporter = smtpUrl ? createTransport(smtpUrl) : null;
    this.from =
      this.config.get<string>('MAIL_FROM') ?? 'no-reply@saas-control.local';

    if (!this.transporter) {
      this.logger.warn(
        'SMTP_URL не задан — письма не отправляются, ссылки пишутся в лог',
      );
    }
  }

  async sendEmailVerification(to: string, link: string): Promise<void> {
    await this.send({
      to,
      subject: 'Подтверждение почты — SaaS Control',
      text: [
        'Здравствуйте!',
        '',
        'Подтвердите почту, чтобы активировать личный кабинет:',
        link,
        '',
        'Ссылка действует 24 часа. Если вы не регистрировались — просто игнорируйте письмо.',
      ].join('\n'),
    });
  }

  private async send(message: {
    to: string;
    subject: string;
    text: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[mail:dev] ${message.to} — ${message.subject}\n${message.text}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({ from: this.from, ...message });
    } catch (error) {
      // письмо не должно ронять регистрацию: клиент уже создан, письмо можно переотправить
      this.logger.error(
        `Не удалось отправить письмо на ${message.to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
