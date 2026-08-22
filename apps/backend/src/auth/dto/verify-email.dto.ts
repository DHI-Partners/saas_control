import { IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @Length(10, 200, { message: 'Некорректная ссылка подтверждения' })
  token: string;
}
