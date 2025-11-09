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

  // Create customer user
  const customerPasswordHash = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash: customerPasswordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      isEmailVerified: true,
    },
  });
  console.log('Created customer user:', customer.email);

  // Create categories
  const categories = [
    {
      slug: 'jewelry',
      nameEn: 'Jewelry',
      nameVi: 'Trang sức',
      descriptionEn: 'Handmade jewelry pieces',
      descriptionVi: 'Trang sức thủ công',
      displayOrder: 1,
    },
    {
      slug: 'home-decor',
      nameEn: 'Home Decor',
      nameVi: 'Đồ trang trí nhà',
      descriptionEn: 'Decorative items for your home',
      descriptionVi: 'Đồ trang trí cho ngôi nhà của bạn',
      displayOrder: 2,
    },
    {
      slug: 'accessories',
      nameEn: 'Accessories',
      nameVi: 'Phụ kiện',
      descriptionEn: 'Handmade accessories',
      descriptionVi: 'Phụ kiện thủ công',
      displayOrder: 3,
    },
    {
      slug: 'art',
      nameEn: 'Art',
      nameVi: 'Nghệ thuật',
      descriptionEn: 'Handmade art pieces',
      descriptionVi: 'Tác phẩm nghệ thuật thủ công',
      displayOrder: 4,
    },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    createdCategories.push(created);
    console.log('Created category:', created.nameEn);
  }

  // Create products
  const products = [
    {
      slug: 'handmade-silver-necklace',
      sku: 'JWL-001',
      nameEn: 'Handmade Silver Necklace',
      nameVi: 'Dây chuyền bạc thủ công',
      descriptionEn:
        'Beautiful handcrafted silver necklace with intricate designs. Perfect for any occasion.',
      descriptionVi:
        'Dây chuyền bạc thủ công đẹp mắt với thiết kế tinh xảo. Hoàn hảo cho mọi dịp.',
      price: 89.99,
      compareAtPrice: 120.0,
      stockQuantity: 25,
      categoryId: createdCategories[0].id,
      isFeatured: true,
    },
    {
      slug: 'ceramic-vase',
      sku: 'DEC-001',
      nameEn: 'Ceramic Vase',
      nameVi: 'Bình gốm',
      descriptionEn:
        'Elegant handmade ceramic vase with unique patterns. Great for flowers or as standalone decor.',
      descriptionVi:
        'Bình gốm thủ công thanh lịch với họa tiết độc đáo. Tuyệt vời cho hoa hoặc làm đồ trang trí độc lập.',
      price: 45.0,
      stockQuantity: 15,
      categoryId: createdCategories[1].id,
      isFeatured: true,
    },
    {
      slug: 'leather-wallet',
      sku: 'ACC-001',
      nameEn: 'Leather Wallet',
      nameVi: 'Ví da',
      descriptionEn:
        'Premium handcrafted leather wallet with multiple card slots. Durable and stylish.',
      descriptionVi:
        'Ví da thủ công cao cấp với nhiều ngăn đựng thẻ. Bền và phong cách.',
      price: 65.0,
      compareAtPrice: 85.0,
      stockQuantity: 30,
      categoryId: createdCategories[2].id,
    },
    {
      slug: 'watercolor-painting',
      sku: 'ART-001',
      nameEn: 'Watercolor Painting',
      nameVi: 'Tranh màu nước',
      descriptionEn:
        'Original watercolor painting of a serene landscape. Signed by the artist.',
      descriptionVi:
        'Tranh màu nước gốc về phong cảnh thanh bình. Có chữ ký của nghệ sĩ.',
      price: 150.0,
      stockQuantity: 5,
      categoryId: createdCategories[3].id,
      isFeatured: true,
    },
    {
      slug: 'beaded-bracelet',
      sku: 'JWL-002',
      nameEn: 'Beaded Bracelet',
      nameVi: 'Vòng tay chuỗi hạt',
      descriptionEn:
        'Colorful handmade beaded bracelet. Adjustable size to fit most wrists.',
      descriptionVi:
        'Vòng tay chuỗi hạt thủ công đầy màu sắc. Kích thước có thể điều chỉnh để phù hợp với hầu hết cổ tay.',
      price: 25.0,
      stockQuantity: 50,
      categoryId: createdCategories[0].id,
    },
    {
      slug: 'wooden-photo-frame',
      sku: 'DEC-002',
      nameEn: 'Wooden Photo Frame',
      nameVi: 'Khung ảnh gỗ',
      descriptionEn:
        'Rustic wooden photo frame with carved details. Holds 5x7 inch photos.',
      descriptionVi:
        'Khung ảnh gỗ mộc mạc với chi tiết chạm khắc. Chứa ảnh 5x7 inch.',
      price: 35.0,
      stockQuantity: 20,
      categoryId: createdCategories[1].id,
    },
  ];

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
    console.log('Created product:', created.nameEn);

    // Add sample images for each product
    await prisma.productImage.create({
      data: {
        productId: created.id,
        url: `https://via.placeholder.com/800x800?text=${encodeURIComponent(created.nameEn)}`,
        altTextEn: created.nameEn,
        altTextVi: created.nameVi,
        displayOrder: 0,
      },
    });
  }

  // Create sample promotion
  const promotion = await prisma.promotion.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      minOrderAmount: 50,
      usageLimit: 100,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    },
  });
  console.log('Created promotion:', promotion.code);

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
  ];

  for (const page of contentPages) {
    const created = await prisma.content.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
    console.log('Created content page:', created.titleEn);
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
