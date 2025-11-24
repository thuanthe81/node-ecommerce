import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Homepage Sections (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    // Login as admin to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@handmade.com',
        password: 'admin123',
      });

    adminToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /content/homepage-sections', () => {
    it('should return only published homepage sections ordered by displayOrder', async () => {
      // Clean up existing homepage sections from seed data
      await prisma.content.deleteMany({
        where: {
          type: 'HOMEPAGE_SECTION',
        },
      });

      // Create test homepage sections
      const section1 = await prisma.content.create({
        data: {
          slug: 'test-section-1',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'Test Section 1',
          titleVi: 'Phần thử nghiệm 1',
          contentEn: 'Description 1',
          contentVi: 'Mô tả 1',
          buttonTextEn: 'Shop Now',
          buttonTextVi: 'Mua ngay',
          linkUrl: '/products',
          layout: 'centered',
          displayOrder: 2,
          isPublished: true,
        },
      });

      const section2 = await prisma.content.create({
        data: {
          slug: 'test-section-2',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'Test Section 2',
          titleVi: 'Phần thử nghiệm 2',
          contentEn: 'Description 2',
          contentVi: 'Mô tả 2',
          buttonTextEn: 'Learn More',
          buttonTextVi: 'Tìm hiểu thêm',
          linkUrl: '/about',
          layout: 'image-left',
          imageUrl: 'https://example.com/image.jpg',
          displayOrder: 1,
          isPublished: true,
        },
      });

      // Create unpublished section (should not be returned)
      const section3 = await prisma.content.create({
        data: {
          slug: 'test-section-3',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'Test Section 3',
          titleVi: 'Phần thử nghiệm 3',
          contentEn: 'Description 3',
          contentVi: 'Mô tả 3',
          buttonTextEn: 'Click Here',
          buttonTextVi: 'Nhấn vào đây',
          linkUrl: '/contact',
          layout: 'image-right',
          imageUrl: 'https://example.com/image2.jpg',
          displayOrder: 0,
          isPublished: false,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/content/homepage-sections')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe(section2.id);
      expect(response.body[1].id).toBe(section1.id);
      expect(response.body[0].displayOrder).toBe(1);
      expect(response.body[1].displayOrder).toBe(2);

      // Cleanup
      await prisma.content.deleteMany({
        where: {
          id: { in: [section1.id, section2.id, section3.id] },
        },
      });
    });
  });

  describe('E2E: Homepage section creation flow', () => {
    it('should create section and make it appear on homepage', async () => {
      // Clean up any existing test section
      await prisma.content.deleteMany({
        where: { slug: 'e2e-test-section' },
      });

      // Step 1: Admin creates a new homepage section
      const createResponse = await request(app.getHttpServer())
        .post('/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'e2e-test-section',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'E2E Test Section',
          titleVi: 'Phần E2E',
          contentEn: 'This is an E2E test section',
          contentVi: 'Đây là phần thử nghiệm E2E',
          buttonTextEn: 'Shop Now',
          buttonTextVi: 'Mua ngay',
          linkUrl: 'https://example.com/products/test',
          layout: 'centered',
          displayOrder: 999,
          isPublished: true,
        })
        .expect(201);

      const createdSection = createResponse.body;
      expect(createdSection.id).toBeDefined();
      expect(createdSection.titleEn).toBe('E2E Test Section');

      // Step 2: Verify section appears on homepage
      const homepageResponse = await request(app.getHttpServer())
        .get('/content/homepage-sections')
        .expect(200);

      const foundSection = homepageResponse.body.find(
        (s: any) => s.id === createdSection.id,
      );
      expect(foundSection).toBeDefined();
      expect(foundSection.titleEn).toBe('E2E Test Section');
      expect(foundSection.linkUrl).toBe('https://example.com/products/test');

      // Cleanup
      await prisma.content.delete({
        where: { id: createdSection.id },
      });
    });
  });

  describe('POST /content (homepage section validation)', () => {
    it('should reject homepage section without required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'invalid-section',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'Test',
          titleVi: 'Test',
          contentEn: 'Description',
          contentVi: 'Mô tả',
          // Missing buttonTextEn, buttonTextVi, linkUrl, layout
        })
        .expect(400);

      expect(response.body.message).toContain('button text');
    });

    it('should reject image-left layout without image', async () => {
      const response = await request(app.getHttpServer())
        .post('/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'invalid-section-2',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'Test',
          titleVi: 'Test',
          contentEn: 'Description',
          contentVi: 'Mô tả',
          buttonTextEn: 'Click',
          buttonTextVi: 'Nhấn',
          linkUrl: 'https://example.com/test',
          layout: 'image-left',
          // Missing imageUrl
        })
        .expect(400);

      expect(response.body.message).toContain('image');
    });

    it('should accept centered layout without image', async () => {
      const response = await request(app.getHttpServer())
        .post('/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'valid-centered-section',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'Test',
          titleVi: 'Test',
          contentEn: 'Description',
          contentVi: 'Mô tả',
          buttonTextEn: 'Click',
          buttonTextVi: 'Nhấn',
          linkUrl: 'https://example.com/test',
          layout: 'centered',
          // No imageUrl - should be OK for centered layout
        })
        .expect(201);

      expect(response.body.layout).toBe('centered');

      // Cleanup
      await prisma.content.delete({
        where: { id: response.body.id },
      });
    });

    it('should accept image-right layout with image', async () => {
      const response = await request(app.getHttpServer())
        .post('/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'valid-image-right-section',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'Test',
          titleVi: 'Test',
          contentEn: 'Description',
          contentVi: 'Mô tả',
          buttonTextEn: 'Click',
          buttonTextVi: 'Nhấn',
          linkUrl: 'https://example.com/test',
          layout: 'image-right',
          imageUrl: 'https://example.com/test.jpg',
        })
        .expect(201);

      expect(response.body.layout).toBe('image-right');
      expect(response.body.imageUrl).toBe('https://example.com/test.jpg');

      // Cleanup
      await prisma.content.delete({
        where: { id: response.body.id },
      });
    });
  });

  describe('E2E: Section reordering', () => {
    it('should reorder sections and reflect new order on homepage', async () => {
      // Clean up existing sections
      await prisma.content.deleteMany({
        where: {
          type: 'HOMEPAGE_SECTION',
          slug: { startsWith: 'reorder-test-' },
        },
      });

      // Create three sections with specific order
      const section1 = await prisma.content.create({
        data: {
          slug: 'reorder-test-1',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'First Section',
          titleVi: 'Phần đầu tiên',
          contentEn: 'First',
          contentVi: 'Đầu tiên',
          buttonTextEn: 'Click',
          buttonTextVi: 'Nhấn',
          linkUrl: 'https://example.com/test1',
          layout: 'centered',
          displayOrder: 1,
          isPublished: true,
        },
      });

      const section2 = await prisma.content.create({
        data: {
          slug: 'reorder-test-2',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'Second Section',
          titleVi: 'Phần thứ hai',
          contentEn: 'Second',
          contentVi: 'Thứ hai',
          buttonTextEn: 'Click',
          buttonTextVi: 'Nhấn',
          linkUrl: 'https://example.com/test2',
          layout: 'centered',
          displayOrder: 2,
          isPublished: true,
        },
      });

      const section3 = await prisma.content.create({
        data: {
          slug: 'reorder-test-3',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'Third Section',
          titleVi: 'Phần thứ ba',
          contentEn: 'Third',
          contentVi: 'Thứ ba',
          buttonTextEn: 'Click',
          buttonTextVi: 'Nhấn',
          linkUrl: 'https://example.com/test3',
          layout: 'centered',
          displayOrder: 3,
          isPublished: true,
        },
      });

      // Verify initial order
      let homepageResponse = await request(app.getHttpServer())
        .get('/content/homepage-sections')
        .expect(200);

      let sections = homepageResponse.body.filter((s: any) =>
        s.slug.startsWith('reorder-test-'),
      );
      expect(sections[0].titleEn).toBe('First Section');
      expect(sections[1].titleEn).toBe('Second Section');
      expect(sections[2].titleEn).toBe('Third Section');

      // Admin reorders: move third to first position
      await request(app.getHttpServer())
        .patch(`/content/${section3.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayOrder: 0,
        })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/content/${section1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayOrder: 1,
        })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/content/${section2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayOrder: 2,
        })
        .expect(200);

      // Verify new order on homepage
      homepageResponse = await request(app.getHttpServer())
        .get('/content/homepage-sections')
        .expect(200);

      sections = homepageResponse.body.filter((s: any) =>
        s.slug.startsWith('reorder-test-'),
      );
      expect(sections[0].titleEn).toBe('Third Section');
      expect(sections[1].titleEn).toBe('First Section');
      expect(sections[2].titleEn).toBe('Second Section');

      // Cleanup
      await prisma.content.deleteMany({
        where: {
          id: { in: [section1.id, section2.id, section3.id] },
        },
      });
    });
  });

  describe('E2E: Section publication toggle', () => {
    it('should hide unpublished section from homepage', async () => {
      // Clean up any existing test section
      await prisma.content.deleteMany({
        where: { slug: 'publication-test' },
      });

      // Step 1: Admin creates a published section via API (this will handle cache properly)
      const createResponse = await request(app.getHttpServer())
        .post('/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slug: 'publication-test',
          type: 'HOMEPAGE_SECTION',
          titleEn: 'Publication Test',
          titleVi: 'Thử nghiệm xuất bản',
          contentEn: 'Test content',
          contentVi: 'Nội dung thử nghiệm',
          buttonTextEn: 'Click',
          buttonTextVi: 'Nhấn',
          linkUrl: 'https://example.com/test',
          layout: 'centered',
          displayOrder: 100,
          isPublished: true,
        })
        .expect(201);

      const section = createResponse.body;

      // Step 2: Verify section appears on homepage
      let homepageResponse = await request(app.getHttpServer())
        .get('/content/homepage-sections')
        .expect(200);

      let foundSection = homepageResponse.body.find(
        (s: any) => s.id === section.id,
      );
      expect(foundSection).toBeDefined();

      // Step 3: Admin unpublishes the section
      await request(app.getHttpServer())
        .patch(`/content/${section.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isPublished: false,
        })
        .expect(200);

      // Step 4: Verify section no longer appears on homepage
      homepageResponse = await request(app.getHttpServer())
        .get('/content/homepage-sections')
        .expect(200);

      foundSection = homepageResponse.body.find((s: any) => s.id === section.id);
      expect(foundSection).toBeUndefined();

      // Step 5: Admin republishes the section
      await request(app.getHttpServer())
        .patch(`/content/${section.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isPublished: true,
        })
        .expect(200);

      // Step 6: Verify section reappears on homepage
      homepageResponse = await request(app.getHttpServer())
        .get('/content/homepage-sections')
        .expect(200);

      foundSection = homepageResponse.body.find((s: any) => s.id === section.id);
      expect(foundSection).toBeDefined();

      // Cleanup
      await prisma.content.delete({
        where: { id: section.id },
      });
    });
  });
});
