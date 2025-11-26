import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CustomerFiltersDto } from './dto/customer-filters.dto';
import { AddressDeduplicationUtil, NormalizedAddress } from './utils/address-deduplication.util';
import { Address } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
      },
    });

    return { message: 'Password updated successfully' };
  }

  async getAddresses(userId: string) {
    // Diagnostic logging to identify address filtering issues
    console.log(`[getAddresses] Fetching addresses for userId: ${userId}`);

    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    // Log the results for debugging
    console.log(`[getAddresses] Found ${addresses.length} addresses for userId: ${userId}`);

    // Verify data integrity - all addresses should belong to the requested user
    const invalidAddresses = addresses.filter(addr => addr.userId !== userId);
    if (invalidAddresses.length > 0) {
      console.error(`[getAddresses] DATA INTEGRITY ERROR: Found ${invalidAddresses.length} addresses with incorrect userId`, {
        requestedUserId: userId,
        invalidAddresses: invalidAddresses.map(a => ({
          id: a.id,
          userId: a.userId,
          fullName: a.fullName
        }))
      });
      // Don't throw error yet, just log for investigation
    }

    // Additional validation: Filter out any addresses that don't belong to this user
    // This provides defense-in-depth even if the database query has issues
    const validAddresses = addresses.filter(addr => addr.userId === userId);

    if (invalidAddresses.length > 0) {
      // Log warning but continue with valid addresses only
      console.warn(`[getAddresses] Filtering out ${invalidAddresses.length} invalid addresses. Returning only ${validAddresses.length} valid addresses.`);
    }

    // Log summary of returned addresses
    console.log(`[getAddresses] Returning ${validAddresses.length} addresses:`, validAddresses.map(a => ({
      id: a.id,
      userId: a.userId,
      fullName: a.fullName,
      isDefault: a.isDefault
    })));

    return validAddresses;
  }

  async getAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async createAddress(userId: string | null, createAddressDto: CreateAddressDto) {
    // For authenticated users, check for duplicate addresses
    if (userId) {
      const normalizedAddress = AddressDeduplicationUtil.normalizeAddress({
        addressLine1: createAddressDto.addressLine1,
        addressLine2: createAddressDto.addressLine2,
        city: createAddressDto.city,
        state: createAddressDto.state,
        postalCode: createAddressDto.postalCode,
        country: createAddressDto.country,
      });

      const existingAddress = await this.findDuplicateAddress(userId, normalizedAddress);

      if (existingAddress) {
        // Update existing address with new contact info and default status
        return this.updateExistingAddress(
          existingAddress.id,
          userId,
          createAddressDto.fullName,
          createAddressDto.phone,
          createAddressDto.isDefault ?? false,
        );
      }
    }

    // No duplicate found or guest user - create new address
    // If this is set as default and user is authenticated, unset other default addresses
    if (createAddressDto.isDefault && userId) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the first address for authenticated user, make it default
    // For guest users (null userId), never set as default
    let isDefault = false;
    if (userId) {
      const addressCount = await this.prisma.address.count({
        where: { userId },
      });
      isDefault = createAddressDto.isDefault ?? addressCount === 0;
    }

    return this.prisma.address.create({
      data: {
        ...createAddressDto,
        userId: userId || null,
        isDefault,
      },
    });
  }

  /**
   * Finds an existing duplicate address for a user
   * Returns null if no duplicate found
   *
   * @param userId - The user ID to search within
   * @param normalizedAddress - The normalized address to search for
   * @returns The existing address if found, null otherwise
   */
  private async findDuplicateAddress(
    userId: string,
    normalizedAddress: NormalizedAddress,
  ): Promise<Address | null> {
    // Get all addresses for the user
    const userAddresses = await this.prisma.address.findMany({
      where: { userId },
    });

    // Compare each address using the deduplication utility
    for (const address of userAddresses) {
      if (AddressDeduplicationUtil.areAddressesDuplicate(normalizedAddress, address)) {
        return address;
      }
    }

    return null;
  }

  /**
   * Updates contact info and default status on existing address
   *
   * @param addressId - The ID of the address to update
   * @param userId - The user ID (for default address management)
   * @param fullName - The new full name
   * @param phone - The new phone number
   * @param isDefault - Whether to set as default
   * @returns The updated address
   */
  private async updateExistingAddress(
    addressId: string,
    userId: string,
    fullName: string,
    phone: string,
    isDefault: boolean,
  ): Promise<Address> {
    // Prepare update data with contact info
    const updateData: any = {
      fullName,
      phone,
    };

    // Only update default status if explicitly setting to true
    // If isDefault is false, preserve the existing default status
    if (isDefault) {
      // Unset other default addresses
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
      updateData.isDefault = true;
    }

    // Update the existing address with new contact info and optionally default status
    return this.prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // If setting this as default, unset other default addresses
    if (updateAddressDto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: updateAddressDto,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // If deleting the default address, set another address as default
    if (address.isDefault) {
      const otherAddress = await this.prisma.address.findFirst({
        where: {
          userId,
          id: { not: addressId },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (otherAddress) {
        await this.prisma.address.update({
          where: { id: otherAddress.id },
          data: { isDefault: true },
        });
      }
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted successfully' };
  }

  // Admin Customer Management Methods

  async findAllCustomersWithStats(filters: CustomerFiltersDto) {
    const {
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    // Build where clause
    const where: any = {
      role: 'CUSTOMER', // Only fetch customers, not admins
    };

    // Add search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add date range filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Calculate total count
    const total = await this.prisma.user.count({ where });

    // Fetch customers with pagination
    const customers = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy:
        sortBy === 'createdAt'
          ? { createdAt: sortOrder }
          : sortBy === 'totalOrders'
          ? { orders: { _count: sortOrder } }
          : undefined,
    });

    // Calculate total spent for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orderStats = await this.prisma.order.aggregate({
          where: { userId: customer.id },
          _sum: { total: true },
        });

        return {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          totalOrders: customer._count.orders,
          totalSpent: orderStats._sum.total || 0,
        };
      }),
    );

    // Sort by totalSpent if requested (can't do this in Prisma query)
    if (sortBy === 'totalSpent') {
      customersWithStats.sort((a, b) => {
        const comparison = Number(a.totalSpent) - Number(b.totalSpent);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return {
      customers: customersWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findCustomerWithDetails(customerId: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        addresses: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            isDefault: true,
          },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate statistics
    const orderStats = await this.prisma.order.aggregate({
      where: { userId: customerId },
      _sum: { total: true },
      _count: true,
    });

    return {
      ...customer,
      totalOrders: orderStats._count,
      totalSpent: orderStats._sum.total || 0,
    };
  }

  async exportCustomersToCSV(filters: CustomerFiltersDto): Promise<Buffer> {
    // Fetch all customers matching filters (without pagination)
    const { customers } = await this.findAllCustomersWithStats({
      ...filters,
      page: 1,
      limit: 10000, // Large limit to get all customers
    });

    // Generate CSV
    const headers = [
      'Email',
      'First Name',
      'Last Name',
      'Registration Date',
      'Total Orders',
      'Total Spent',
    ];

    const rows = customers.map((customer) => [
      customer.email,
      customer.firstName || '',
      customer.lastName || '',
      customer.createdAt.toISOString(),
      customer.totalOrders.toString(),
      customer.totalSpent.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }
}
