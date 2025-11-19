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
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
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
}
