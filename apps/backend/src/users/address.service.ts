import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserAddress } from './entities/user-address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address-loyalty.dto';

@Injectable()
export class AddressService {
  private readonly MAX_ADDRESSES = 10;

  constructor(
    @InjectRepository(UserAddress)
    private readonly addressRepo: Repository<UserAddress>,
  ) {}

  // ─── Lấy danh sách địa chỉ ────────────────────────────────
  async findAll(userId: string): Promise<UserAddress[]> {
    return this.addressRepo.find({
      where: { userId, deletedAt: IsNull() },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  // ─── Lấy 1 địa chỉ (và verify owner) ─────────────────────
  async findOne(id: string, userId: string): Promise<UserAddress> {
    const address = await this.addressRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!address) throw new NotFoundException('Địa chỉ không tồn tại');
    if (address.userId !== userId) throw new ForbiddenException('Không có quyền truy cập');
    return address;
  }

  // ─── Tạo địa chỉ mới ──────────────────────────────────────
  async create(userId: string, dto: CreateAddressDto): Promise<UserAddress> {
    const count = await this.addressRepo.count({
      where: { userId, deletedAt: IsNull() },
    });
    if (count >= this.MAX_ADDRESSES) {
      throw new BadRequestException(`Tối đa ${this.MAX_ADDRESSES} địa chỉ`);
    }

    // Nếu là default, bỏ default các địa chỉ cũ
    if (dto.isDefault) {
      await this.clearDefault(userId);
    }

    // Nếu là địa chỉ đầu tiên, tự động set default
    const isFirst = count === 0;

    const address = this.addressRepo.create({
      userId,
      ...dto,
      isDefault: dto.isDefault || isFirst,
    });
    return this.addressRepo.save(address);
  }

  // ─── Cập nhật địa chỉ ─────────────────────────────────────
  async update(id: string, userId: string, dto: UpdateAddressDto): Promise<UserAddress> {
    const address = await this.findOne(id, userId);

    if (dto.isDefault && !address.isDefault) {
      await this.clearDefault(userId);
    }

    Object.assign(address, dto);
    return this.addressRepo.save(address);
  }

  // ─── Xóa địa chỉ (soft delete) ────────────────────────────
  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);

    if (address.isDefault) {
      // Tự động set địa chỉ khác thành default
      const others = await this.addressRepo.find({
        where: { userId, deletedAt: IsNull() },
        order: { createdAt: 'ASC' },
      });
      const next = others.find(a => a.id !== id);
      if (next) {
        await this.addressRepo.update(next.id, { isDefault: true });
      }
    }

    await this.addressRepo.softDelete(id);
  }

  // ─── Set địa chỉ mặc định ─────────────────────────────────
  async setDefault(id: string, userId: string): Promise<UserAddress> {
    const address = await this.findOne(id, userId);
    await this.clearDefault(userId);
    address.isDefault = true;
    return this.addressRepo.save(address);
  }

  // ─── Internal ─────────────────────────────────────────────
  private async clearDefault(userId: string): Promise<void> {
    await this.addressRepo.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
  }
}
