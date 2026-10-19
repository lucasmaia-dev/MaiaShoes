import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PRODUCT_IMAGE_PATHS } from '../product-images.js';

export class CreateProductDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: 'O nome deve ser um texto.' })
  @Length(1, 150, { message: 'O nome deve ter entre 1 e 150 caracteres.' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(2000, { message: 'A descrição deve ter no máximo 2000 caracteres.' })
  description?: string;

  @IsOptional()
  @IsIn(PRODUCT_IMAGE_PATHS, { message: 'Escolha uma foto da galeria importada.' })
  imageUrl?: string | null;

  // O preço viaja como texto decimal para preservar os centavos.
  @IsString({ message: 'Envie o preço como texto, por exemplo "189.90".' })
  @Matches(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/, {
    message: 'O preço deve ser de 0 a 99999999.99, com ponto e até duas casas decimais.',
  })
  price!: string;
}
