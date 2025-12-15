import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { STATUS } from '../common/constants';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('events')
  async trackEvent(
    @Body() createEventDto: CreateAnalyticsEventDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    return this.analyticsService.trackEvent(createEventDto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(STATUS.USER_ROLES.ADMIN)
  @Get('dashboard')
  async getDashboard(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboardMetrics(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(STATUS.USER_ROLES.ADMIN)
  @Get('sales')
  async getSalesReport(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSalesReport(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(STATUS.USER_ROLES.ADMIN)
  @Get('products/:id/performance')
  async getProductPerformance(
    @Param('id') productId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getProductPerformance(productId, query);
  }
}
