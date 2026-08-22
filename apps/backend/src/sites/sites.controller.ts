import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentClient } from '../auth/current-client.decorator';
import type { PublicClient } from '../clients/client.select';
import { CreateSiteDto } from './dto/create-site.dto';
import { ListSitesDto } from './dto/list-sites.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get()
  list(@CurrentClient() client: PublicClient, @Query() query: ListSitesDto) {
    return this.sites.list(client.id, query);
  }

  @Post()
  create(@CurrentClient() client: PublicClient, @Body() dto: CreateSiteDto) {
    return this.sites.create({ id: client.id, email: client.email }, dto);
  }

  @Get(':id')
  findOne(
    @CurrentClient() client: PublicClient,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sites.findOne(client.id, id);
  }

  @Get(':id/provisioning')
  provisioning(
    @CurrentClient() client: PublicClient,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sites.provisioning(client.id, id);
  }

  @Patch(':id')
  update(
    @CurrentClient() client: PublicClient,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSiteDto,
  ) {
    return this.sites.update(client.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentClient() client: PublicClient,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.sites.remove(client.id, id);
  }
}
