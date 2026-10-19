import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Product } from '../generated/prisma/client.js';
import { Prisma } from '../generated/prisma/client.js';
import type { CreateProductDto } from './dto/create-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: { name: data.name, description: data.description, price: data.price, imageUrl: data.imageUrl },
    });
    return this.toResponse(product);
  }

  async findAll() {
    const products = await this.prisma.product.findMany({ orderBy: { id: 'desc' } });
    return products.map((product) => this.toResponse(product));
  }

  async updateImage(id: number, imageUrl: string | null) {
    try {
      const product = await this.prisma.product.update({ where: { id }, data: { imageUrl } });
      return this.toResponse(product);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Produto não encontrado.');
      }
      throw error;
    }
  }

  private toResponse(product: Product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price.toFixed(2),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
