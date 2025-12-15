import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { STATUS } from '../common/constants';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(STATUS.USER_ROLES.ADMIN)
  getCount() {
    return this.usersService.getCount();
  }

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Put('password')
  updatePassword(
    @CurrentUser() user: any,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(user.id, updatePasswordDto);
  }

  @Get('addresses')
  getAddresses(@CurrentUser() user: any) {
    // Diagnostic logging to verify JWT token and user extraction
    console.log(`[UsersController.getAddresses] Request from user:`, {
      id: user?.id,
      email: user?.email,
      hasUser: !!user
    });

    if (!user || !user.id) {
      console.error(`[UsersController.getAddresses] ERROR: No user or user.id in request`);
      throw new Error('User authentication failed');
    }

    return this.usersService.getAddresses(user.id);
  }

  @Get('addresses/:id')
  getAddress(@CurrentUser() user: any, @Param('id') addressId: string) {
    return this.usersService.getAddress(user.id, addressId);
  }

  @Post('addresses')
  @Public()
  createAddress(
    @CurrentUser() user: any,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    // Support both authenticated and guest users
    return this.usersService.createAddress(user?.id || null, createAddressDto);
  }

  @Put('addresses/:id')
  updateAddress(
    @CurrentUser() user: any,
    @Param('id') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(
      user.id,
      addressId,
      updateAddressDto,
    );
  }

  @Delete('addresses/:id')
  deleteAddress(@CurrentUser() user: any, @Param('id') addressId: string) {
    return this.usersService.deleteAddress(user.id, addressId);
  }
}
