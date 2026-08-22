import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { PublicClient } from '../clients/client.select';
import { AuthService } from './auth.service';
import { CurrentClient } from './current-client.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Public } from './public.decorator';
import { clearSessionCookie, setSessionCookie } from './session.cookie';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.register(dto);
    setSessionCookie(res, session.token, session.maxAgeMs);
    return { client: session.client };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.login(dto);
    setSessionCookie(res, session.token, session.maxAgeMs);
    return { client: session.client };
  }

  // публичный: разлогиниться нужно и с протухшим токеном
  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    clearSessionCookie(res);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return { client: await this.auth.verifyEmail(dto.token) };
  }

  @Post('verify-email/resend')
  @HttpCode(202)
  async resendVerification(@CurrentClient() client: PublicClient) {
    await this.auth.resendVerification(client);
    return { status: 'sent' };
  }
}
