import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Address Filtering (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.address.deleteMany({
      where: {
        OR: [
          { fullName: { contains: 'Test User 1' } },
          { fullName: { contains: 'Test User 2' } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['addresstest1@example.com', 'addresstest2@example.com'],
        },
      },
    });

    // Create two test users
    const user1Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'addresstest1@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User1',
      });
    user1Token = user1Response.body.accessToken;
    user1Id = user1Response.body.user.id;

    const user2Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'addresstest2@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User2',
      });
    user2Token = user2Response.body.accessToken;
    user2Id = user2Response.body.user.id;

    // Create addresses for user 1
    await request(app.getHttpServer())
      .post('/users/addresses')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        fullName: 'Test User 1 Address 1',
        phone: '+1234567890',
        addressLine1: '123 User 1 Street',
        city: 'City1',
        state: 'State1',
        postalCode: '12345',
        country: 'US',
      });

    await request(app.getHttpServer())
      .post('/users/addresses')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        fullName: 'Test User 1 Address 2',
        phone: '+1234567891',
        addressLine1: '456 User 1 Avenue',
        city: 'City1',
        state: 'State1',
        postalCode: '12346',
        country: 'US',
      });

    // Create addresses for user 2
    await request(app.getHttpServer())
      .post('/users/addresses')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        fullName: 'Test User 2 Address 1',
        phone: '+0987654321',
        addressLine1: '789 User 2 Road',
        city: 'City2',
        state: 'State2',
        postalCode: '54321',
        country: 'US',
      });

    // Create a guest address (null userId)
    await prisma.address.create({
      data: {
        userId: null,
        fullName: 'Guest User Address',
        phone: '+1111111111',
        addressLine1: '999 Guest Street',
        city: 'GuestCity',
        state: 'GuestState',
        postalCode: '99999',
        country: 'US',
        isDefault: false,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.address.deleteMany({
      where: {
        OR: [
          { fullName: { contains: 'Test User 1' } },
          { fullName: { contains: 'Test User 2' } },
          { fullName: { contains: 'Guest User' } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['addresstest1@example.com', 'addresstest2@example.com'],
        },
      },
    });

    await app.close();
  });

  it('should return only user 1 addresses for user 1', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/addresses')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2);

    // All addresses should belong to user 1
    response.body.forEach((address: any) => {
      expect(address.userId).toBe(user1Id);
      expect(address.fullName).toContain('Test User 1');
    });

    // Should not contain user 2 addresses
    const hasUser2Address = response.body.some((addr: any) =>
      addr.fullName.includes('Test User 2'),
    );
    expect(hasUser2Address).toBe(false);

    // Should not contain guest addresses
    const hasGuestAddress = response.body.some((addr: any) =>
      addr.fullName.includes('Guest User'),
    );
    expect(hasGuestAddress).toBe(false);
  });

  it('should return only user 2 addresses for user 2', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/addresses')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);

    // All addresses should belong to user 2
    response.body.forEach((address: any) => {
      expect(address.userId).toBe(user2Id);
      expect(address.fullName).toContain('Test User 2');
    });

    // Should not contain user 1 addresses
    const hasUser1Address = response.body.some((addr: any) =>
      addr.fullName.includes('Test User 1'),
    );
    expect(hasUser1Address).toBe(false);

    // Should not contain guest addresses
    const hasGuestAddress = response.body.some((addr: any) =>
      addr.fullName.includes('Guest User'),
    );
    expect(hasGuestAddress).toBe(false);
  });

  it('should not allow user 1 to access user 2 address by ID', async () => {
    // Get user 2's address
    const user2Addresses = await request(app.getHttpServer())
      .get('/users/addresses')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    const user2AddressId = user2Addresses.body[0].id;

    // Try to access it with user 1's token
    await request(app.getHttpServer())
      .get(`/users/addresses/${user2AddressId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(404); // Should not find the address
  });

  it('should not return addresses without authentication', async () => {
    await request(app.getHttpServer())
      .get('/users/addresses')
      .expect(401); // Unauthorized
  });
});
