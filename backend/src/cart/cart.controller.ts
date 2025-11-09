import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Public()
  @Get()
  async getCart(@CurrentUser() user: any, @Req() req: Request) {
    const userId = user?.id;
    const sessionId = this.getSessionId(req);
    return this.cartService.getCart(userId, sessionId);
  }

  @Public()
  @Post('items')
  async addItem(
    @Body() addToCartDto: AddToCartDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const userId = user?.id;
    const sessionId = this.getSessionId(req);
    return this.cartService.addItem(addToCartDto, userId, sessionId);
  }

  @Public()
  @Put('items/:id')
  async updateItem(
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const userId = user?.id;
    const sessionId = this.getSessionId(req);
    return this.cartService.updateItem(id, updateCartItemDto, userId, sessionId);
  }

  @Public()
  @Delete('items/:id')
  async removeItem(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const userId = user?.id;
    const sessionId = this.getSessionId(req);
    return this.cartService.removeItem(id, userId, sessionId);
  }

  @Public()
  @Delete()
  async clearCart(@CurrentUser() user: any, @Req() req: Request) {
    const userId = user?.id;
    const sessionId = this.getSessionId(req);
    return this.cartService.clearCart(userId, sessionId);
  }

  @Post('merge')
  async mergeGuestCart(@CurrentUser() user: any, @Req() req: Request) {
    const userId = user.id;
    const sessionId = this.getSessionId(req);
    return this.cartService.mergeGuestCart(userId, sessionId);
  }

  /**
   * Get or create session ID from request
   */
  private getSessionId(req: Request): string {
    // Try to get session ID from cookie or header
    let sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    if (!sessionId) {
      // Generate new session ID
      sessionId = this.generateSessionId();
    }

    return sessionId as string;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
