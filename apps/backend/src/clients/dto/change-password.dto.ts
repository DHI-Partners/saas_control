import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'Введите текущий пароль' })
  @MaxLength(72)
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @MaxLength(72, { message: 'Пароль должен быть не длиннее 72 символов' })
  newPassword: string;
}
