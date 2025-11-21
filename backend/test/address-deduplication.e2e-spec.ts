import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Address Deduplication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    // Clean up test data - delete in correct order due to foreign keys
    await prisma.order.deleteMany({
      where: {
        user: {
          email: { startsWith: 'dedup-test' },
        },
      },
    });
    await prisma.address.deleteMany({
      where: {
        user: {
          email: { startsWith: 'dedup-test' },
        },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'dedup-test' } },
    });

    // Create a test user and get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'dedup-test@example.com',
        password: 'Password123!',
        firstName: 'Dedup',
        lastName: 'Test',
      })
      .expect(201);

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  beforeEach(async () => {
    // Clean up addresses between tests but keep the user
    await prisma.address.deleteMany({
      where: { userId },
    });
  });

  describe('Duplicate Detection', () => {
    it('should return existing address when creating duplicate', async () => {
      const addressData = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefault: false,
      };

      // Create first address
      const firstResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(201);

      const firstAddressId = firstResponse.body.id;

      // Try to create duplicate address
      const secondResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(201);

      // Should return the same address ID
      expect(secondResponse.body.id).toBe(firstAddressId);

      // Verify only one address exists in database
      const addresses = await prisma.address.findMany({
        where: { userId },
      });
      expect(addresses).toHaveLength(1);
    });

    it('should detect duplicates with different whitespace', async () => {
      const firstAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const secondAddress = {
        fullName: 'Jane Doe',
        phone: '+0987654321',
        addressLine1: '  123   Main   St  ', // Extra whitespace
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      // Create first address
      const firstResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstAddress)
        .expect(201);

      const firstAddressId = firstResponse.body.id;

      // Create second address with different whitespace
      const secondResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondAddress)
        .expect(201);

      // Should return the same address ID
      expect(secondResponse.body.id).toBe(firstAddressId);

      // Verify only one address exists
      const addresses = await prisma.address.findMany({
        where: { userId },
      });
      expect(addresses).toHaveLength(1);
    });

    it('should detect duplicates with different case', async () => {
      const firstAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 main st',
        city: 'new york',
        state: 'ny',
        postalCode: '10001',
        country: 'us',
      };

      const secondAddress = {
        fullName: 'Jane Doe',
        phone: '+0987654321',
        addressLine1: '123 MAIN ST',
        city: 'NEW YORK',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      // Create first address
      const firstResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstAddress)
        .expect(201);

      const firstAddressId = firstResponse.body.id;

      // Create second address with different case
      const secondResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondAddress)
        .expect(201);

      // Should return the same address ID
      expect(secondResponse.body.id).toBe(firstAddressId);
    });

    it('should detect duplicates with different postal code formatting', async () => {
      const firstAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001-1234',
        country: 'US',
      };

      const secondAddress = {
        fullName: 'Jane Doe',
        phone: '+0987654321',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10 001 1234', // Different formatting
        country: 'US',
      };

      // Create first address
      const firstResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstAddress)
        .expect(201);

      const firstAddressId = firstResponse.body.id;

      // Create second address with different postal code format
      const secondResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondAddress)
        .expect(201);

      // Should return the same address ID
      expect(secondResponse.body.id).toBe(firstAddressId);
    });
  });

  describe('Contact Information Update', () => {
    it('should update fullName and phone when duplicate detected', async () => {
      const firstAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const secondAddress = {
        fullName: 'Jane Smith',
        phone: '+0987654321',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      // Create first address
      await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstAddress)
        .expect(201);

      // Create duplicate with different contact info
      const response = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondAddress)
        .expect(201);

      // Should have updated contact info
      expect(response.body.fullName).toBe('Jane Smith');
      expect(response.body.phone).toBe('+0987654321');
    });
  });

  describe('Default Address Handling', () => {
    it('should update default status when duplicate detected with isDefault=true', async () => {
      const firstAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefault: false,
      };

      const secondAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefault: true,
      };

      // Create first address (explicitly not default)
      const firstResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstAddress)
        .expect(201);

      const firstAddressId = firstResponse.body.id;

      // Create another address and make it default
      await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'John Doe',
          phone: '+1234567890',
          addressLine1: '456 Other St',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'US',
          isDefault: true,
        })
        .expect(201);

      // Verify first address is not default
      const firstAddressCheck = await prisma.address.findUnique({
        where: { id: firstAddressId },
      });
      expect(firstAddressCheck?.isDefault).toBe(false);

      // Now create duplicate of first address with isDefault=true
      const response = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondAddress)
        .expect(201);

      // Should have updated default status
      expect(response.body.isDefault).toBe(true);
      expect(response.body.id).toBe(firstAddressId);
    });

    it('should preserve default status when duplicate detected with isDefault=false', async () => {
      const firstAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefault: true,
      };

      const secondAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefault: false,
      };

      // Create first address (default)
      const firstResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstAddress)
        .expect(201);

      expect(firstResponse.body.isDefault).toBe(true);

      // Create duplicate with isDefault=false
      const response = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondAddress)
        .expect(201);

      // Should preserve default status (remains true)
      expect(response.body.isDefault).toBe(true);
      expect(response.body.id).toBe(firstResponse.body.id);
    });

    it('should ensure only one address per user has isDefault=true', async () => {
      // Create multiple addresses
      const address1 = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'John Doe',
          phone: '+1234567890',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          isDefault: true,
        })
        .expect(201);

      // Verify first address is default
      expect(address1.body.isDefault).toBe(true);

      // Create second address as default
      const address2 = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Jane Doe',
          phone: '+0987654321',
          addressLine1: '456 Other St',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'US',
          isDefault: true,
        })
        .expect(201);

      // Verify second address is now default
      expect(address2.body.isDefault).toBe(true);

      // Verify only one address is default in database
      const allAddresses = await prisma.address.findMany({
        where: { userId },
      });
      const defaultAddresses = allAddresses.filter((addr) => addr.isDefault);
      expect(defaultAddresses).toHaveLength(1);
      expect(defaultAddresses[0].id).toBe(address2.body.id);

      // Create third address as default
      const address3 = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Bob Smith',
          phone: '+1122334455',
          addressLine1: '789 Third Ave',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
          country: 'US',
          isDefault: true,
        })
        .expect(201);

      // Verify third address is now default
      expect(address3.body.isDefault).toBe(true);

      // Verify only one address is default in database
      const allAddressesAfter = await prisma.address.findMany({
        where: { userId },
      });
      const defaultAddressesAfter = allAddressesAfter.filter(
        (addr) => addr.isDefault,
      );
      expect(defaultAddressesAfter).toHaveLength(1);
      expect(defaultAddressesAfter[0].id).toBe(address3.body.id);
    });

    it('should ensure only one address is default when setting duplicate as default', async () => {
      // Create first address (not default)
      const address1 = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'John Doe',
          phone: '+1234567890',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          isDefault: false,
        })
        .expect(201);

      // Create second address as default
      const address2 = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Jane Doe',
          phone: '+0987654321',
          addressLine1: '456 Other St',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'US',
          isDefault: true,
        })
        .expect(201);

      // Verify second address is default
      expect(address2.body.isDefault).toBe(true);

      // Create duplicate of first address with isDefault=true
      const duplicateResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'John Doe',
          phone: '+1234567890',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          isDefault: true,
        })
        .expect(201);

      // Should return the first address with updated default status
      expect(duplicateResponse.body.id).toBe(address1.body.id);
      expect(duplicateResponse.body.isDefault).toBe(true);

      // Verify only one address is default in database
      const allAddresses = await prisma.address.findMany({
        where: { userId },
      });
      const defaultAddresses = allAddresses.filter((addr) => addr.isDefault);
      expect(defaultAddresses).toHaveLength(1);
      expect(defaultAddresses[0].id).toBe(address1.body.id);

      // Verify second address is no longer default
      const address2Updated = await prisma.address.findUnique({
        where: { id: address2.body.id },
      });
      expect(address2Updated?.isDefault).toBe(false);
    });
  });

  describe('Guest Address Handling', () => {
    it('should allow guest users to create duplicate addresses', async () => {
      const addressData = {
        fullName: 'Guest User',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      // Create first guest address (simulated by orders service)
      const firstAddress = await prisma.address.create({
        data: {
          ...addressData,
          userId: null,
        },
      });

      // Create second guest address with same data
      const secondAddress = await prisma.address.create({
        data: {
          ...addressData,
          userId: null,
        },
      });

      // Should have different IDs
      expect(firstAddress.id).not.toBe(secondAddress.id);

      // Verify both addresses exist
      const guestAddresses = await prisma.address.findMany({
        where: { userId: null },
      });
      expect(guestAddresses.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('User Address Isolation', () => {
    it('should allow different users to create same address', async () => {
      const addressData = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      // Create first user's address
      await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(201);

      // Create second user directly in database to avoid rate limiting
      const secondUser = await prisma.user.create({
        data: {
          email: 'dedup-test2@example.com',
          passwordHash: 'dummy-hash',
          firstName: 'Second',
          lastName: 'User',
        },
      });

      // Create same address for second user directly
      await prisma.address.create({
        data: {
          ...addressData,
          userId: secondUser.id,
        },
      });

      // Verify both users have their own address
      const user1Addresses = await prisma.address.findMany({
        where: { userId },
      });
      const user2Addresses = await prisma.address.findMany({
        where: { userId: secondUser.id },
      });

      expect(user1Addresses).toHaveLength(1);
      expect(user2Addresses).toHaveLength(1);
      expect(user1Addresses[0].id).not.toBe(user2Addresses[0].id);
    });
  });

  describe('Edge Cases', () => {
    it('should treat addresses with different addressLine2 as different', async () => {
      const firstAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 1',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const secondAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 2',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      // Create first address
      const firstResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstAddress)
        .expect(201);

      // Create second address with different addressLine2
      const secondResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondAddress)
        .expect(201);

      // Should have different IDs
      expect(firstResponse.body.id).not.toBe(secondResponse.body.id);

      // Verify both addresses exist
      const addresses = await prisma.address.findMany({
        where: { userId },
      });
      expect(addresses).toHaveLength(2);
    });

    it('should treat addresses with different country as different', async () => {
      const firstAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      const secondAddress = {
        fullName: 'John Doe',
        phone: '+1234567890',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'CA',
      };

      // Create first address
      const firstResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstAddress)
        .expect(201);

      // Create second address with different country
      const secondResponse = await request(app.getHttpServer())
        .post('/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondAddress)
        .expect(201);

      // Should have different IDs
      expect(firstResponse.body.id).not.toBe(secondResponse.body.id);

      // Verify both addresses exist
      const addresses = await prisma.address.findMany({
        where: { userId },
      });
      expect(addresses).toHaveLength(2);
    });
  });
});
