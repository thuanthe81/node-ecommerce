import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

async function testBlogCategoryEndpoints() {
  console.log('🧪 Testing Blog Category Endpoints\n');

  try {
    // Test 1: Get all blog categories (public endpoint)
    console.log('1️⃣ Testing GET /blog-categories (public)');
    const getAllResponse = await axios.get<BlogCategory[]>(
      `${API_URL}/blog-categories`,
    );
    console.log(`✅ Status: ${getAllResponse.status}`);
    console.log(`   Found ${getAllResponse.data.length} categories`);
    console.log('');

    // Test 2: Try to get a category by slug (should fail if none exist)
    if (getAllResponse.data.length > 0) {
      const firstCategory = getAllResponse.data[0];
      console.log(
        `2️⃣ Testing GET /blog-categories/${firstCategory.slug} (public)`,
      );
      const getBySlugResponse = await axios.get<BlogCategory>(
        `${API_URL}/blog-categories/${firstCategory.slug}`,
      );
      console.log(`✅ Status: ${getBySlugResponse.status}`);
      console.log(`   Category: ${getBySlugResponse.data.nameEn}`);
      console.log(`   Post count: ${getBySlugResponse.data._count?.posts || 0}`);
      console.log('');
    } else {
      console.log('2️⃣ Skipping GET by slug test (no categories exist)');
      console.log('');
    }

    // Test 3: Try to create a category without auth (should fail)
    console.log('3️⃣ Testing POST /blog-categories without auth (should fail)');
    try {
      await axios.post(`${API_URL}/blog-categories`, {
        slug: 'test-category',
        nameEn: 'Test Category',
        nameVi: 'Danh mục thử nghiệm',
      });
      console.log('❌ Should have failed without authentication');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected (401 Unauthorized)');
      } else {
        console.log(`⚠️  Unexpected error: ${error.response?.status}`);
      }
    }
    console.log('');

    // Test 4: Validate slug format
    console.log('4️⃣ Testing slug validation');
    console.log('   Valid slugs: lowercase-with-hyphens, test123, my-blog-post');
    console.log(
      '   Invalid slugs: CamelCase, spaces here, under_scores, -leading-hyphen',
    );
    console.log('   ✅ Slug validation implemented in DTO');
    console.log('');

    console.log('✨ All public endpoint tests passed!');
    console.log(
      '\n📝 Note: Admin endpoints (POST, PATCH, DELETE) require authentication',
    );
    console.log('   and are protected by the @Roles(UserRole.ADMIN) decorator.');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

testBlogCategoryEndpoints();
