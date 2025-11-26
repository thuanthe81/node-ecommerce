import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AdminCustomersController } from './admin-customers.controller';
import { UsersService } from './users.service';
import { AddressCleanupService } from './address-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, AdminCustomersController],
  providers: [UsersService, AddressCleanupService],
  exports: [UsersService],
})
export class UsersModule {}
