import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim, TrimLower } from '../../common/transforms';

export class RegisterDto {
  @TrimLower()
  @IsEmail({}, { message: 'Некорректный адрес почты' })
  email: string;

  // 72 байта — предел bcrypt, всё лишнее он молча отбросил бы
  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @MaxLength(72, { message: 'Пароль должен быть не длиннее 72 символов' })
  password: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  name?: string;
}
