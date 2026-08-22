import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../common/transforms';

export class UpdateProfileDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  name?: string;
}
