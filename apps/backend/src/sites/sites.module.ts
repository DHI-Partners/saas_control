import { Module } from '@nestjs/common';
import { BridgeModule } from '../bridge/bridge.module';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';

@Module({
  imports: [BridgeModule],
  controllers: [SitesController],
  providers: [SitesService],
})
export class SitesModule {}
