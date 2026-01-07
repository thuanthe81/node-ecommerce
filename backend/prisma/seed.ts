import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@handmade.com' },
    update: {},
    create: {
      email: 'admin@handmade.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create sample content pages
  const contentPages = [
    {
      slug: 'about-us',
      type: 'PAGE' as const,
      titleEn: 'About Us',
      titleVi: 'Về chúng tôi',
      contentEn:
        'We are passionate artisans creating unique handmade products with love and care.',
      contentVi:
        'Chúng tôi là những nghệ nhân đam mê tạo ra các sản phẩm thủ công độc đáo với tình yêu và sự chăm sóc.',
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: 'shipping-policy',
      type: 'PAGE' as const,
      titleEn: 'Shipping Policy',
      titleVi: 'Chính sách vận chuyển',
      contentEn:
        'We ship worldwide. Standard shipping takes 5-7 business days.',
      contentVi:
        'Chúng tôi giao hàng toàn cầu. Vận chuyển tiêu chuẩn mất 5-7 ngày làm việc.',
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: 'return-policy',
      type: 'PAGE' as const,
      titleEn: 'Return Policy',
      titleVi: 'Chính sách đổi trả',
      contentEn:
        'We accept returns within 30 days of purchase. Items must be in original condition.',
      contentVi:
        'Chúng tôi chấp nhận đổi trả trong vòng 30 ngày kể từ ngày mua. Sản phẩm phải ở tình trạng ban đầu.',
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: 'purchasing-guide',
      type: 'PAGE' as const,
      titleEn: 'Purchasing Guide',
      titleVi: 'Hướng dẫn mua hàng',
      contentEn:
        '<p>Here is some guide to purchase products</p>',
      contentVi:
        '<p>Sau đây là một số hướng dẫn mua hàng</p>',
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: 'privacy-policy',
      type: 'PAGE' as const,
      titleEn: 'Privacy Policy',
      titleVi: 'Chính sách bảo mật',
      contentEn:
        '<p>Something about Privacy</p>',
      contentVi:
        '<p>Chi tiết về chích sách bảo mật</p>',
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: 'term-of-service',
      type: 'PAGE' as const,
      titleEn: 'Term Of Service',
      titleVi: 'Điều khoản sử dụng',
      contentEn:
        '<p>Something about services</p>',
      contentVi:
        '<p>Một vài điều về điều khoản sử dụng</p>',
      isPublished: true,
      publishedAt: new Date(),
    },
  ];

  for (const page of contentPages) {
    const created = await prisma.content.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
    console.log('Created content page:', created.titleEn);
  }

  // Create footer settings
  const footerSettings = await prisma.footerSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      copyrightText: '© 2026 ALA Craft. All rights reserved.',
      contactEmail: 'alacraft.design196@gmail.com',
      contactPhone: '+84986754551',
      facebookUrl: 'https://www.facebook.com/profile.php?id=61572402124474',
      tiktokUrl: 'https://www.tiktok.com/@dinhketduongdai',
      zaloUrl: 'https://zalo.me/+84986754551',
      whatsappUrl: 'https://wa.me/+84986754551',
    },
  });
  console.log('Created footer settings');

  // Create sample homepage sections
  const homepageSections = [
    {
      slug: 'welcome-section',
      type: 'HOMEPAGE_SECTION' as const,
      titleEn: 'Welcome to ALA Craft',
      titleVi: 'Chào mừng đến với ALA Craft',
      contentEn:
        'Discover unique handmade treasures crafted with love and care by talented artisans. Each piece tells a story.',
      contentVi:
        'Khám phá những món đồ thủ công độc đáo được chế tác với tình yêu và sự chăm sóc bởi các nghệ nhân tài năng. Mỗi sản phẩm đều kể một câu chuyện.',
      buttonTextEn: 'Shop Now',
      buttonTextVi: 'Mua ngay',
      linkUrl: '/products',
      layout: 'centered',
      displayOrder: 1,
      isPublished: true,
      publishedAt: new Date(),
    },
  ];

  for (const section of homepageSections) {
    const created = await prisma.content.upsert({
      where: { slug: section.slug },
      update: {},
      create: section,
    });
    console.log('Created homepage section:', created.titleEn);
  }

  // Create shipping methods (migrating from hardcoded logic)
  const shippingMethods = [
    {
      methodId: 'standard',
      nameEn: 'Standard Shipping',
      nameVi: 'Vận chuyển tiêu chuẩn',
      descriptionEn: 'Delivery in 5-7 business days',
      descriptionVi: 'Giao hàng trong 5-7 ngày làm việc',
      carrier: 'Standard Delivery',
      baseRate: 30000,
      estimatedDaysMin: 5,
      estimatedDaysMax: 7,
      weightThreshold: 1.0,
      weightRate: 2.0,
      freeShippingThreshold: 100.0,
      isActive: true,
      displayOrder: 1,
    },
    {
      methodId: 'express',
      nameEn: 'Express Shipping',
      nameVi: 'Vận chuyển nhanh',
      descriptionEn: 'Delivery in 2-3 business days',
      descriptionVi: 'Giao hàng trong 2-3 ngày làm việc',
      carrier: 'Express Delivery',
      baseRate: 100000,
      estimatedDaysMin: 2,
      estimatedDaysMax: 3,
      weightThreshold: 1.0,
      weightRate: 3.0,
      isActive: true,
      displayOrder: 2,
    },
  ];

  for (const method of shippingMethods) {
    const created = await prisma.shippingMethod.upsert({
      where: { methodId: method.methodId },
      update: {},
      create: method,
    });
    console.log('Created shipping method:', created.nameEn);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
