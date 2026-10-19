import { Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductsService } from './products.service.js';
import { UpdateProductImageDto } from './dto/update-product-image.dto.js';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto.js';

@Controller('products')
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly products: ProductsService) {}

  @Post()
  create(@Body() data: CreateProductDto) {
    return this.products.create(data);
  }

  @Get()
  findAll() {
    return this.products.findAll();
  }

  @Patch(':id/image')
  updateImage(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProductImageDto) {
    return this.products.updateImage(id, data.imageUrl);
  }

  @Patch(':id/category')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProductCategoryDto) {
    return this.products.updateCategory(id, data.category);
  }
}
