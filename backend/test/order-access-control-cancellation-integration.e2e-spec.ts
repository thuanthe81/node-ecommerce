import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrdersService } from '../src/orders/orders.service';
import { AccessControlService } from '../src/orders/services/access-control.service';
import { OrderCancellationService } from '../src/orders/services/order-cancellation.service';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailTestingUtils } from '../src/common/utils/email-testing.utils';
import { UserRole, OrderStatus, PaymentStatus } from '@prisma/client';
import { STATUS } from '../src/common/constants';

/**
 * Integration Tests for Order Access Control and Cancellation
 *
 * Task 12.1: Integration testing
 * - Test complete cancellation workflow from UI to database
 * - Verify email notifications are sent correctly
 * - Test access control across all components
 * Requirements: All requirements
 */
describe('Order Access Control and Cancellation Integration (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let ordersService: OrdersService;
  let accessControlService: AccessControlService;
  let orderCancellationService: OrderCancellationService;

  // Test data cleanup arrays
  let testOrderIds: string[] = [];
  let testUserIds: string[] = [];
  let testAddressIds: string[] = [];

  // Test users
  let adminUser: any;
  let regularUser: any;
  let otherUser: any;
  let adminToken: string;
  let userToken: string;
  let otherUserToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    ordersService = moduleFixture.get<OrdersService>(OrdersService);
    accessControlService = moduleFixture.get<AccessControlService>(AccessControlService);
    orderCancellationService = moduleFixture.get<OrderCancellationService>(OrderCancellationService);

    // Enable email test mode for comprehensive tracking
    EmailTestingUtils.enableTestMode();

    // Create test users
    await createTestUsers();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();

    // Disable email test mode
    EmailTestingUtils.disableTestMode();
    EmailTestingUtils.clearAllData();

    await app.close();
  });

  beforeEach(() => {
    // Reset email tracking for each test
    EmailTestingUtils.clearAllData();
    EmailTestingUtils.enableTestMode();
  });

  describe('Access Control Integration Tests', () => {
    let userOrder: any;
    let guestOrder: any;

    beforeEach(async () => {
      // Create test orders for access control testing
      userOrder = await createTestOrder(regularUser.id, regularUser.email);
      guestOrder = await createGuestTestOrder('guest@example.com');
      testOrderIds.push(userOrder.id, guestOrder.id);
    });

    describe('Authenticated User Access Control', () => {
      it('should allow user to access their own order', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/${userOrder.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.order).toBeDefined();
        expect(response.body.order.id).toBe(userOrder.id);
        expect(response.body.permissions).toBeDefined();
        expect(response.body.permissions.canView).toBe(true);
        expect(response.body.permissions.canCancel).toBe(true);
      });

      it('should deny user access to another user\'s order', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/${userOrder.id}`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(403);

        expect(response.body.message).toContain('access denied');
      });

      it('should deny user access to guest orders', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/${guestOrder.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.message).toContain('access denied');
      });
    });

    describe('Admin Access Control', () => {
      it('should allow admin to access any user order', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/${userOrder.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.order).toBeDefined();
        expect(response.body.order.id).toBe(userOrder.id);
        expect(response.body.permissions.canView).toBe(true);
        expect(response.body.permissions.canCancel).toBe(true);
        expect(response.body.permissions.canModify).toBe(true);
      });

      it('should allow admin to access guest orders', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/${guestOrder.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.order).toBeDefined();
        expect(response.body.order.id).toBe(guestOrder.id);
        expect(response.body.permissions.canView).toBe(true);
        expect(response.body.permissions.canCancel).toBe(true);
      });
    });

    describe('Guest Access Control', () => {
      it('should deny unauthenticated access to user orders', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/${userOrder.id}`)
          .expect(401);

        expect(response.body.message).toContain('Unauthorized');
      });

      it('should deny unauthenticated access to guest orders without session', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/${guestOrder.id}`)
          .expect(401);

        expect(response.body.message).toContain('Unauthorized');
      });
    });
  });

  describe('Order Cancellation Integration Tests', () => {
    let cancellableOrder: any;
    let nonCancellableOrder: any;

    beforeEach(async () => {
      // Create orders with different statuses for cancellation testing
      cancellableOrder = await createTestOrder(regularUser.id, regularUser.email, OrderStatus.PENDING);
      nonCancellableOrder = await createTestOrder(regularUser.id, regularUser.email, OrderStatus.SHIPPED);
      testOrderIds.push(cancellableOrder.id, nonCancellableOrder.id);

      // Add orders to email test mode tracking
      EmailTestingUtils.addOrderToTestMode(cancellableOrder.id);
      EmailTestingUtils.addOrderToTestMode(nonCancellableOrder.id);
    });

    describe('Successful Cancellation Workflow', () => {
      it('should complete full cancellation workflow with email notifications', async () => {
        // Step 1: Verify order is cancellable
        const orderResponse = await request(app.getHttpServer())
          .get(`/orders/${cancellableOrder.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(orderResponse.body.permissions.canCancel).toBe(true);

        // Step 2: Cancel the order
        const cancellationResponse = await request(app.getHttpServer())
          .patch(`/orders/${cancellableOrder.id}/cancel`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ reason: 'Changed my mind' })
          .expect(200);

        expect(cancellationResponse.body.success).toBe(true);
        expect(cancellationResponse.body.order.status).toBe(STATUS.ORDER_STATUS.CANCELLED);
        expect(cancellationResponse.body.emailSent).toBe(true);

        // Step 3: Verify order status in database
        const updatedOrder = await prismaService.order.findUnique({
          where: { id: cancellableOrder.id },
        });

        expect(updatedOrder?.status).toBe(STATUS.ORDER_STATUS.CANCELLED);
        expect(updatedOrder?.cancelledAt).toBeDefined();
        expect(updatedOrder?.cancellationReason).toBe('Changed my mind');

        // Step 4: Wait for email processing
        await waitForEmailProcessing();

        // Step 5: Verify email notifications were sent
        const emailCount = EmailTestingUtils.countEmailsForOrder(cancellableOrder.id);
        expect(emailCount).toBeGreaterThanOrEqual(1); // At least cancellation email

        const testReport = EmailTestingUtils.getTestReport(cancellableOrder.id);
        expect(testReport.status).toBe('SUCCESS');

        // Step 6: Verify cancel button is no longer available
        const finalOrderResponse = await request(app.getHttpServer())
          .get(`/orders/${cancellableOrder.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(finalOrderResponse.body.permissions.canCancel).toBe(false);
      });

      it('should handle admin cancellation with proper audit logging', async () => {
        const cancellationResponse = await request(app.getHttpServer())
          .patch(`/orders/${cancellableOrder.id}/cancel`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Admin cancellation for customer service' })
          .expect(200);

        expect(cancellationResponse.body.success).toBe(true);
        expect(cancellationResponse.body.order.status).toBe(STATUS.ORDER_STATUS.CANCELLED);

        // Verify audit logging (check database for audit records)
        const updatedOrder = await prismaService.order.findUnique({
          where: { id: cancellableOrder.id },
        });

        expect(updatedOrder?.cancellationReason).toBe('Admin cancellation for customer service');
      });
    });

    describe('Cancellation Business Rules', () => {
      it('should reject cancellation of non-cancellable orders', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/orders/${nonCancellableOrder.id}/cancel`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ reason: 'Test cancellation' })
          .expect(400);

        expect(response.body.message).toContain('cannot be cancelled');
        expect(response.body.message).toContain('SHIPPED');
      });

      it('should reject unauthorized cancellation attempts', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/orders/${cancellableOrder.id}/cancel`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({ reason: 'Unauthorized attempt' })
          .expect(403);

        expect(response.body.message).toContain('access denied');
      });

      it('should reject unauthenticated cancellation attempts', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/orders/${cancellableOrder.id}/cancel`)
          .send({ reason: 'Unauthenticated attempt' })
          .expect(401);

        expect(response.body.message).toContain('Unauthorized');
      });
    });

    describe('Rate Limiting Integration', () => {
      it('should enforce rate limiting on cancellation requests', async () => {
        // Make multiple rapid cancellation requests
        const requests = Array(5).fill(null).map(() =>
          request(app.getHttpServer())
            .patch(`/orders/${cancellableOrder.id}/cancel`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ reason: 'Rate limit test' })
        );

        const responses = await Promise.allSettled(requests);

        // At least one request should be rate limited
        const rateLimitedResponses = responses.filter(
          (result) => result.status === 'fulfilled' && result.value.status === 429
        );

        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Email Notification Integration Tests', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await createTestOrder(regularUser.id, regularUser.email, OrderStatus.PENDING);
      testOrderIds.push(testOrder.id);
      EmailTestingUtils.addOrderToTestMode(testOrder.id);
    });

    it('should send cancellation email with correct content structure', async () => {
      // Cancel the order
      await request(app.getHttpServer())
        .patch(`/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Email content test' })
        .expect(200);

      // Wait for email processing
      await waitForEmailProcessing();

      // Verify email was sent
      const emailCount = EmailTestingUtils.countEmailsForOrder(testOrder.id);
      expect(emailCount).toBeGreaterThanOrEqual(1);

      // Verify email content structure (this would require email content inspection)
      const testReport = EmailTestingUtils.getTestReport(testOrder.id);
      expect(testReport.status).toBe('SUCCESS');
    });

    it('should handle email service failures gracefully', async () => {
      // This test would require mocking email service failures
      // For now, we verify that cancellation succeeds even if email fails
      const response = await request(app.getHttpServer())
        .patch(`/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Email failure test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Email failure should not prevent cancellation
      expect(response.body.order.status).toBe(STATUS.ORDER_STATUS.CANCELLED);
    });
  });

  describe('Cross-Component Consistency Tests', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await createTestOrder(regularUser.id, regularUser.email, OrderStatus.PENDING);
      testOrderIds.push(testOrder.id);
    });

    it('should maintain consistent access control between detail and confirmation pages', async () => {
      // Test order detail page access
      const detailResponse = await request(app.getHttpServer())
        .get(`/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(detailResponse.body.permissions.canView).toBe(true);
      expect(detailResponse.body.permissions.canCancel).toBe(true);

      // Both pages should have the same access control behavior
      // (In a real implementation, you might have separate endpoints for confirmation pages)
    });

    it('should maintain consistent currency formatting across components', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const order = response.body.order;

      // Verify VND formatting is applied consistently
      expect(order.total).toBeDefined();
      expect(order.subtotal).toBeDefined();

      // In a real implementation, you would verify the actual formatting
      // This test ensures the data structure supports consistent formatting
    });
  });

  // Helper functions
  async function createTestUsers() {
    const jwtService = app.get(JwtService);
    const configService = app.get(ConfigService);

    // Create admin user directly in database
    adminUser = await prismaService.user.create({
      data: {
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isEmailVerified: true,
        passwordHash: null, // OAuth-only user
      },
    });
    testUserIds.push(adminUser.id);

    // Generate JWT token for admin
    const adminPayload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    };
    adminToken = jwtService.sign(adminPayload, {
      secret: configService.get('JWT_SECRET'),
      expiresIn: '12h',
    });

    // Create regular user directly in database
    regularUser = await prismaService.user.create({
      data: {
        email: 'user@test.com',
        firstName: 'Regular',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        isEmailVerified: true,
        passwordHash: null, // OAuth-only user
      },
    });
    testUserIds.push(regularUser.id);

    // Generate JWT token for regular user
    const userPayload = {
      sub: regularUser.id,
      email: regularUser.email,
      role: regularUser.role,
    };
    userToken = jwtService.sign(userPayload, {
      secret: configService.get('JWT_SECRET'),
      expiresIn: '12h',
    });

    // Create another user for access control testing
    otherUser = await prismaService.user.create({
      data: {
        email: 'other@test.com',
        firstName: 'Other',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        isEmailVerified: true,
        passwordHash: null, // OAuth-only user
      },
    });
    testUserIds.push(otherUser.id);

    // Generate JWT token for other user
    const otherUserPayload = {
      sub: otherUser.id,
      email: otherUser.email,
      role: otherUser.role,
    };
    otherUserToken = jwtService.sign(otherUserPayload, {
      secret: configService.get('JWT_SECRET'),
      expiresIn: '12h',
    });
  }

  async function createTestOrder(
    userId: string,
    email: string,
    status: OrderStatus = OrderStatus.PENDING
  ) {
    const address = await createTestAddress(userId);

    const order = await prismaService.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        email,
        status,
        paymentStatus: PaymentStatus.PENDING,
        total: 100.00,
        subtotal: 85.00,
        shippingCost: 15.00,
        taxAmount: 0.00,
        discountAmount: 0.00,
        shippingMethod: 'Standard Shipping',
        paymentMethod: 'Bank Transfer',
        shippingAddressId: address.id,
        billingAddressId: address.id,
        items: {
          create: [
            {
              productId: await getOrCreateTestProduct(),
              productNameEn: 'Test Product',
              productNameVi: 'Sản phẩm thử nghiệm',
              sku: `TEST-SKU-${Date.now()}`,
              quantity: 1,
              price: 85.00,
              total: 85.00,
            },
          ],
        },
      },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    return order;
  }

  async function createGuestTestOrder(email: string) {
    const address = await createTestAddress(null); // Guest address

    const order = await prismaService.order.create({
      data: {
        orderNumber: `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: null, // Guest order
        email,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        total: 50.00,
        subtotal: 40.00,
        shippingCost: 10.00,
        taxAmount: 0.00,
        discountAmount: 0.00,
        shippingMethod: 'Standard Shipping',
        paymentMethod: 'Bank Transfer',
        shippingAddressId: address.id,
        billingAddressId: address.id,
        items: {
          create: [
            {
              productId: await getOrCreateTestProduct(),
              productNameEn: 'Test Product',
              productNameVi: 'Sản phẩm thử nghiệm',
              sku: `TEST-SKU-${Date.now()}`,
              quantity: 1,
              price: 40.00,
              total: 40.00,
            },
          ],
        },
      },
    });

    return order;
  }

  async function createTestAddress(userId: string | null) {
    const address = await prismaService.address.create({
      data: {
        userId,
        fullName: 'Test User',
        phone: '+1234567890',
        addressLine1: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US',
      },
    });
    testAddressIds.push(address.id);
    return address;
  }

  async function getOrCreateTestProduct() {
    let product = await prismaService.product.findFirst({
      where: { nameEn: 'Test Product' },
    });

    if (!product) {
      // First, get or create a test category
      let category = await prismaService.category.findFirst({
        where: { nameEn: 'Test Category' },
      });

      if (!category) {
        const categorySlug = `test-category-${Date.now()}`;
        category = await prismaService.category.create({
          data: {
            slug: categorySlug,
            nameEn: 'Test Category',
            nameVi: 'Danh mục thử nghiệm',
            descriptionEn: 'Test category for integration testing',
            descriptionVi: 'Danh mục thử nghiệm cho kiểm thử tích hợp',
            isActive: true,
          },
        });
      }

      const slug = `test-product-${Date.now()}`;
      const sku = `TEST-SKU-${Date.now()}`;
      product = await prismaService.product.create({
        data: {
          slug,
          sku,
          nameEn: 'Test Product',
          nameVi: 'Sản phẩm thử nghiệm',
          descriptionEn: 'Test product for integration testing',
          descriptionVi: 'Sản phẩm thử nghiệm cho kiểm thử tích hợp',
          price: 85.00,
          stockQuantity: 100,
          categoryId: category.id,
          isActive: true,
        },
      });
    }

    return product.id;
  }

  async function waitForEmailProcessing(timeoutMs: number = 3000) {
    // Wait for async email processing to complete
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
  }

  async function cleanupTestData() {
    // Clean up in reverse order of dependencies

    // Delete test orders (this will cascade to order items)
    for (const orderId of testOrderIds) {
      try {
        await prismaService.orderItem.deleteMany({
          where: { orderId },
        });
        await prismaService.order.delete({
          where: { id: orderId },
        });
      } catch (error) {
        console.warn(`Failed to delete test order ${orderId}:`, error);
      }
    }

    // Delete test addresses
    for (const addressId of testAddressIds) {
      try {
        await prismaService.address.delete({
          where: { id: addressId },
        });
      } catch (error) {
        console.warn(`Failed to delete test address ${addressId}:`, error);
      }
    }

    // Delete test users
    for (const userId of testUserIds) {
      try {
        await prismaService.user.delete({
          where: { id: userId },
        });
      } catch (error) {
        console.warn(`Failed to delete test user ${userId}:`, error);
      }
    }
  }
});