import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SaveFeedbackDto {
  @IsIn(['AVALIACAO', 'SUGESTAO'])
  kind!: 'AVALIACAO' | 'SUGESTAO';

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  message!: string;

  @ValidateIf(
    (data: SaveFeedbackDto) =>
      data.kind === 'AVALIACAO' || data.rating !== undefined,
  )
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsBoolean()
  publishConsent!: boolean;
}

export class ModerateFeedbackDto {
  @IsIn(['APROVADO', 'ARQUIVADO', 'PENDENTE'])
  status!: 'APROVADO' | 'ARQUIVADO' | 'PENDENTE';

  @IsISO8601()
  updatedAt!: string;
}
