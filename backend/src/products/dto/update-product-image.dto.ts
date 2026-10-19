import { IsDefined, IsIn, ValidateIf } from 'class-validator';
import { PRODUCT_IMAGE_PATHS } from '../product-images.js';

export class UpdateProductImageDto {
  // null remove a foto; omitir o campo é um erro.
  @ValidateIf((_object: unknown, value: unknown) => value !== null)
  @IsDefined({ message: 'Informe a foto ou null para removê-la.' })
  @IsIn(PRODUCT_IMAGE_PATHS, { message: 'Escolha uma foto da galeria importada.' })
  imageUrl!: string | null;
}
