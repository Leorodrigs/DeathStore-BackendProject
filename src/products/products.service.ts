import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ProductsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createProductDto: Prisma.ProductCreateInput) {
    return this.databaseService.product.create({
      data: createProductDto,
    });
  }

  async findAll(filters?: {
    category?: string;
    brand?: string;
    name?: string;
  }) {
    const where: Prisma.ProductWhereInput = {};

    if (filters?.category) {
      where.category = {
        contains: filters.category,
        mode: 'insensitive',
      };
    }

    if (filters?.brand) {
      where.brand = {
        contains: filters.brand,
        mode: 'insensitive',
      };
    }

    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    return this.databaseService.product.findMany({
      where,

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.databaseService.product.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateProductDto: Prisma.ProductUpdateInput) {
    return this.databaseService.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number) {
    return this.databaseService.product.delete({
      where: { id },
    });
  }

  async findByCategory(category: string) {
    return this.databaseService.product.findMany({
      where: {
        category: {
          contains: category,
          mode: 'insensitive',
        },
      },
    });
  }

  async findByBrand(brand: string) {
    return this.databaseService.product.findMany({
      where: {
        brand: {
          contains: brand,
          mode: 'insensitive',
        },
      },
    });
  }
}
