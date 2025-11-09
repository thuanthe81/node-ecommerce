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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.userId);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, updateProfileDto);
  }

  @Put('password')
  updatePassword(
    @CurrentUser() user: any,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(user.userId, updatePasswordDto);
  }

  @Get('addresses')
  getAddresses(@CurrentUser() user: any) {
    return this.usersService.getAddresses(user.userId);
  }

  @Get('addresses/:id')
  getAddress(@CurrentUser() user: any, @Param('id') addressId: string) {
    return this.usersService.getAddress(user.userId, addressId);
  }

  @Post('addresses')
  createAddress(
    @CurrentUser() user: any,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(user.userId, createAddressDto);
  }

  @Put('addresses/:id')
  updateAddress(
    @CurrentUser() user: any,
    @Param('id') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.userId, addressId, updateAddressDto);
  }

  @Delete('addresses/:id')
  deleteAddress(@CurrentUser() user: any, @Param('id') addressId: string) {
    return this.usersService.deleteAddress(user.userId, addressId);
  }
}
