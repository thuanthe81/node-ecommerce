import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressCleanupService {
  private readonly logger = new Logger(AddressCleanupService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Clean up orphaned guest addresses older than 90 days
   * Runs daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOrphanedAddresses() {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Delete addresses with null userId older than 90 days
      const result = await this.prisma.address.deleteMany({
        where: {
          userId: null,
          createdAt: {
            lt: ninetyDaysAgo,
          },
        },
      });

      this.logger.log(
        `Cleaned up ${result.count} orphaned guest addresses older than 90 days`,
      );
    } catch (error) {
      this.logger.error('Failed to clean up orphaned addresses', error);
    }
  }
}
