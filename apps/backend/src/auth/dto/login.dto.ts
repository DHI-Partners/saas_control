import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { TrimLower } from '../../common/transforms';

export class LoginDto {
  @TrimLower()
  @IsEmail({}, { message: 'Некорректный адрес почты' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Введите пароль' })
  @MaxLength(72)
  password: string;
}
