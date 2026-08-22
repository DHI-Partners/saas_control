import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health/db')
  async healthDb() {
    const [{ now }] = await this.prisma.$queryRaw<
      { now: Date }[]
    >`SELECT now()`;
    return { status: 'ok', now };
  }
}
