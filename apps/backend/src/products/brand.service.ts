import {
  ConflictException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateBrandDto, UpdateBrandDto } from './dto/product.dto';
import { Brand } from './entities/brand.entity';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) {}

  async findAll(activeOnly = true): Promise<Brand[]> {
    return this.brandRepo.find({
      where: activeOnly
        ? { isActive: true, deletedAt: IsNull() }
        : { deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Brand> {
    const brand = await this.brandRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!brand) throw new NotFoundException('Thương hiệu không tồn tại');
    return brand;
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    const exists = await this.brandRepo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Slug đã tồn tại');
    const brand = this.brandRepo.create(dto);
    return this.brandRepo.save(brand);
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findById(id);
    if (dto.slug && dto.slug !== brand.slug) {
      const exists = await this.brandRepo.findOne({ where: { slug: dto.slug } });
      if (exists) throw new ConflictException('Slug đã tồn tại');
    }
    Object.assign(brand, dto);
    return this.brandRepo.save(brand);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.brandRepo.softDelete(id);
  }
}