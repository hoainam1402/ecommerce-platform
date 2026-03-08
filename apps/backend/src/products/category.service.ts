import {
  ConflictException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/product.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  // ─── Lấy cây danh mục ─────────────────────────────────────
  async findTree(parentId?: string): Promise<Category[]> {
    if (parentId) {
      // Chỉ lấy con của parentId
      return this.categoryRepo.find({
        where: { parentId, isActive: true, deletedAt: IsNull() },
        relations: ['children'],
        order: { sortOrder: 'ASC', name: 'ASC' },
      });
    }

    // Lấy toàn bộ cây: root trước, load children theo nested
    const roots = await this.categoryRepo.find({
      where: { parentId: IsNull(), isActive: true, deletedAt: IsNull() },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    // Load children đệ quy
    for (const root of roots) {
      root.children = await this.loadChildren(root.id);
    }
    return roots;
  }

  // ─── Lấy tất cả (admin, kể cả inactive) ──────────────────
  async findAll(): Promise<Category[]> {
    return this.categoryRepo.find({
      where: { deletedAt: IsNull() },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Category> {
    const cat = await this.categoryRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['parent', 'children'],
    });
    if (!cat) throw new NotFoundException('Danh mục không tồn tại');
    return cat;
  }

  async findBySlug(slug: string): Promise<Category> {
    const cat = await this.categoryRepo.findOne({
      where: { slug, deletedAt: IsNull() },
    });
    if (!cat) throw new NotFoundException('Danh mục không tồn tại');
    return cat;
  }

  // ─── CRUD ─────────────────────────────────────────────────
  async create(dto: CreateCategoryDto): Promise<Category> {
    const exists = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Slug đã tồn tại');

    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    if (dto.slug && dto.slug !== category.slug) {
      const exists = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
      if (exists) throw new ConflictException('Slug đã tồn tại');
    }

    // Không cho set parent = chính nó
    if (dto.parentId === id) {
      dto.parentId = undefined;
    }

    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.categoryRepo.softDelete(id);
  }

  // ─── Internal: load children đệ quy (tối đa 3 cấp) ──────
  private async loadChildren(parentId: string, depth = 0): Promise<Category[]> {
    if (depth >= 3) return [];
    const children = await this.categoryRepo.find({
      where: { parentId, isActive: true, deletedAt: IsNull() },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    for (const child of children) {
      child.children = await this.loadChildren(child.id, depth + 1);
    }
    return children;
  }
}