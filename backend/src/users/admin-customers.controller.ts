import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CONSTANTS } from '@alacraft/shared';
import { CustomerFiltersDto } from './dto/customer-filters.dto';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
export class AdminCustomersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllCustomers(@Query() filters: CustomerFiltersDto) {
    return this.usersService.findAllCustomersWithStats(filters);
  }

  @Get('export')
  async exportCustomers(@Query() filters: CustomerFiltersDto): Promise<StreamableFile> {
    const csvBuffer = await this.usersService.exportCustomersToCSV(filters);
    return new StreamableFile(csvBuffer, {
      type: 'text/csv',
      disposition: `attachment; filename="customers-${new Date().toISOString()}.csv"`,
    });
  }

  @Get(':id')
  async getCustomerDetail(@Param('id') id: string) {
    return this.usersService.findCustomerWithDetails(id);
  }
}
