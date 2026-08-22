import { Body, Controller, Get, HttpCode, Patch, Put } from '@nestjs/common';
import { CurrentClient } from '../auth/current-client.decorator';
import type { PublicClient } from './client.select';
import { ClientsService } from './clients.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

/** Личный кабинет: всё про самого клиента. Чужой id сюда передать нельзя. */
@Controller('me')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  profile(@CurrentClient() client: PublicClient) {
    return this.clients.profile(client.id);
  }

  @Patch()
  update(@CurrentClient() client: PublicClient, @Body() dto: UpdateProfileDto) {
    return this.clients.updateProfile(client.id, dto);
  }

  @Put('password')
  @HttpCode(204)
  changePassword(
    @CurrentClient() client: PublicClient,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.clients.changePassword(client.id, dto);
  }
}
