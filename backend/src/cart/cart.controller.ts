import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: any) {
    const userId = user.id;
    return this.cartService.getCart(userId);
  }

  @Post('items')
  async addItem(
    @Body() addToCartDto: AddToCartDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.id;
    return this.cartService.addItem(addToCartDto, userId);
  }

  @Put('items/:id')
  async updateItem(
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @CurrentUser() user: any,
  ) {
    const userId = user.id;
    return this.cartService.updateItem(id, updateCartItemDto, userId);
  }

  @Delete('items/:id')
  async removeItem(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.id;
    return this.cartService.removeItem(id, userId);
  }

  @Delete()
  async clearCart(@CurrentUser() user: any) {
    const userId = user.id;
    return this.cartService.clearCart(userId);
  }
}
