import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteDto } from './create-site.dto';

/** Все поля создания, но каждое необязательно. */
export class UpdateSiteDto extends PartialType(CreateSiteDto) {}
