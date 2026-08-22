import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  TrimLower,
  TrimLowerEach,
  TrimLowerToNull,
  TrimToNull,
} from '../../common/transforms';
import { SitePlan, SiteStatus } from '../../generated/prisma/enums';

/** Имя сайта в bench — это хост, поэтому проверяем как доменное имя. */
export const SITE_NAME_RE =
  /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;

/** Имена frappe-приложений: erpnext, hrms, payments, ... */
const APP_NAME_RE = /^[a-z][a-z0-9_]{0,49}$/;

export class CreateSiteDto {
  @TrimLower()
  @IsString()
  @Matches(SITE_NAME_RE, {
    message: 'Имя сайта — доменное имя, например crm.example.com',
  })
  name: string;

  @IsOptional()
  @TrimLowerToNull()
  @Matches(SITE_NAME_RE, { message: 'Домен указан неверно' })
  domain?: string | null;

  @IsOptional()
  @IsEnum(SiteStatus, { message: 'Неизвестный статус сайта' })
  status?: SiteStatus;

  @IsOptional()
  @IsEnum(SitePlan, { message: 'Неизвестный тариф' })
  plan?: SitePlan;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(30)
  frappeVersion?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @Matches(APP_NAME_RE, {
    each: true,
    message: 'Имя приложения — латиница в нижнем регистре, напр. erpnext',
  })
  @TrimLowerEach()
  apps?: string[];

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
