import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../common/transforms';
import { SiteStatus } from '../../generated/prisma/enums';

export class ListSitesDto {
  @IsOptional()
  @IsEnum(SiteStatus, { message: 'Неизвестный статус сайта' })
  status?: SiteStatus;

  /** Поиск по имени, домену и заметкам. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  q?: string;
}
