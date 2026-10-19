import { IsEnum } from 'class-validator';
import { ProductCategory } from '../../generated/prisma/client.js';

export class UpdateProductCategoryDto {
  @IsEnum(ProductCategory, { message: 'Escolha Tênis, Bolsas ou Sem categoria.' })
  category!: ProductCategory;
}
