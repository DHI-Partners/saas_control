import path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { PrismaModule } from './prisma/prisma.module';
import { SitesModule } from './sites/sites.module';

@Module({
  imports: [
    // .env в монорепо один — корневой. В докере его нет: там всё приходит
    // из environment контейнера, а несуществующий файл ConfigModule молча
    // пропускает. Переменные окружения в любом случае сильнее файла.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), '../../.env'),
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    SitesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
