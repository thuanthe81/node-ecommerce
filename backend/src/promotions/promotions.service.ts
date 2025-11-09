import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ValidatePromotionDto } from './dto/validate-promotion.dto';
import { Promotion, PromotionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    // Check if code already exists
    const existing = await this.prisma.promotion.findUnique({
      where: { code: createPromotionDto.code },
    });

    if (existing) {
      throw new BadRequestException('Promotion code already exists');
    }

    // Validate dates
    const startDate = new Date(createPromotionDto.startDate);
    const endDate = new Date(createPromotionDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate percentage value
    if (createPromotionDto.type === PromotionType.PERCENTAGE && createPromotionDto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    return this.prisma.promotion.create({
      data: {
        code: createPromotionDto.code,
        type: createPromotionDto.type,
        value: new Decimal(createPromotionDto.value),
        minOrderAmount: createPromotionDto.minOrderAmount 
          ? new Decimal(createPromotionDto.minOrderAmount) 
          : null,
        maxDiscountAmount: createPromotionDto.maxDiscountAmount 
          ? new Decimal(createPromotionDto.maxDiscountAmount) 
          : null,
        usageLimit: createPromotionDto.usageLimit,
        perCustomerLimit: createPromotionDto.perCustomerLimit,
        startDate,
        endDate,
        isActive: createPromotionDto.isActive ?? true,
      },
    });
  }

  async findAll(): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return promotion;
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto): Promise<Promotion> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    // Check if code is being changed and if it already exists
    if (updatePromotionDto.code && updatePromotionDto.code !== promotion.code) {
      const existing = await this.prisma.promotion.findUnique({
        where: { code: updatePromotionDto.code },
      });

      if (existing) {
        throw new BadRequestException('Promotion code already exists');
      }
    }

    // Validate dates if provided
    if (updatePromotionDto.startDate || updatePromotionDto.endDate) {
      const startDate = updatePromotionDto.startDate 
        ? new Date(updatePromotionDto.startDate) 
        : promotion.startDate;
      const endDate = updatePromotionDto.endDate 
        ? new Date(updatePromotionDto.endDate) 
        : promotion.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Validate percentage value
    if (updatePromotionDto.type === PromotionType.PERCENTAGE && 
        updatePromotionDto.value && 
        updatePromotionDto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    const updateData: any = {};
    
    if (updatePromotionDto.code) updateData.code = updatePromotionDto.code;
    if (updatePromotionDto.type) updateData.type = updatePromotionDto.type;
    if (updatePromotionDto.value !== undefined) updateData.value = new Decimal(updatePromotionDto.value);
    if (updatePromotionDto.minOrderAmount !== undefined) {
      updateData.minOrderAmount = updatePromotionDto.minOrderAmount 
        ? new Decimal(updatePromotionDto.minOrderAmount) 
        : null;
    }
    if (updatePromotionDto.maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount = updatePromotionDto.maxDiscountAmount 
        ? new Decimal(updatePromotionDto.maxDiscountAmount) 
        : null;
    }
    if (updatePromotionDto.usageLimit !== undefined) updateData.usageLimit = updatePromotionDto.usageLimit;
    if (updatePromotionDto.perCustomerLimit !== undefined) updateData.perCustomerLimit = updatePromotionDto.perCustomerLimit;
    if (updatePromotionDto.startDate) updateData.startDate = new Date(updatePromotionDto.startDate);
    if (updatePromotionDto.endDate) updateData.endDate = new Date(updatePromotionDto.endDate);
    if (updatePromotionDto.isActive !== undefined) updateData.isActive = updatePromotionDto.isActive;

    return this.prisma.promotion.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<Promotion> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return this.prisma.promotion.delete({
      where: { id },
    });
  }

  async validate(validatePromotionDto: ValidatePromotionDto): Promise<{
    valid: boolean;
    promotion?: Promotion;
    discountAmount?: number;
    message?: string;
  }> {
    const { code, orderAmount, userId } = validatePromotionDto;

    // Find promotion by code
    const promotion = await this.prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promotion) {
      return {
        valid: false,
        message: 'Invalid promotion code',
      };
    }

    // Check if promotion is active
    if (!promotion.isActive) {
      return {
        valid: false,
        message: 'This promotion is no longer active',
      };
    }

    // Check date validity
    const now = new Date();
    if (now < promotion.startDate) {
      return {
        valid: false,
        message: 'This promotion has not started yet',
      };
    }

    if (now > promotion.endDate) {
      return {
        valid: false,
        message: 'This promotion has expired',
      };
    }

    // Check usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return {
        valid: false,
        message: 'This promotion has reached its usage limit',
      };
    }

    // Check per customer limit
    if (userId && promotion.perCustomerLimit) {
      const customerUsageCount = await this.prisma.order.count({
        where: {
          userId,
          promotionId: promotion.id,
        },
      });

      if (customerUsageCount >= promotion.perCustomerLimit) {
        return {
          valid: false,
          message: 'You have reached the usage limit for this promotion',
        };
      }
    }

    // Check minimum order amount
    if (promotion.minOrderAmount && orderAmount < Number(promotion.minOrderAmount)) {
      return {
        valid: false,
        message: `Minimum order amount of $${promotion.minOrderAmount} required`,
      };
    }

    // Calculate discount
    const discountAmount = this.calculateDiscount(
      promotion,
      orderAmount,
    );

    return {
      valid: true,
      promotion,
      discountAmount,
    };
  }

  calculateDiscount(promotion: Promotion, orderAmount: number): number {
    let discount = 0;

    if (promotion.type === PromotionType.PERCENTAGE) {
      discount = (orderAmount * Number(promotion.value)) / 100;
    } else if (promotion.type === PromotionType.FIXED) {
      discount = Number(promotion.value);
    }

    // Apply max discount limit if set
    if (promotion.maxDiscountAmount && discount > Number(promotion.maxDiscountAmount)) {
      discount = Number(promotion.maxDiscountAmount);
    }

    // Discount cannot exceed order amount
    if (discount > orderAmount) {
      discount = orderAmount;
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  }

  async incrementUsageCount(promotionId: string): Promise<void> {
    await this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }
}
