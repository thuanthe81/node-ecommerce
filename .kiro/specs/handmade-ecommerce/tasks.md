# Implementation Plan

## Project Setup and Infrastructure

- [x] 1. Initialize project structure and dependencies
  - Create monorepo structure with separate frontend and backend directories
  - Initialize Next.js 14+ project with TypeScript and App Router
  - Initialize NestJS project with TypeScript
  - Configure TailwindCSS in Next.js project
  - Set up ESLint and Prettier for both projects
  - Configure for local PostgreSQL and Redis (no Docker)
  - _Requirements: 20.5_

- [x] 2. Set up database and ORM
  - Install and configure Prisma or TypeORM
  - Create database schema for all entities (users, products, categories, orders, etc.)
  - Write initial database migration files
  - Create seed scripts for development data
  - Configure database connection pooling
  - _Requirements: 6.1, 7.1, 10.1_

- [x] 3. Configure internationalization infrastructure
  - Install and configure next-intl or react-i18next in Next.js
  - Create a single locale file containing both Vietnamese and English translations (locales/translations.json with nested structure)
  - Set up locale detection and routing strategy
  - Implement locale switcher component
  - Configure hreflang tags for SEO
  - _Requirements: 1.5, 7.4_

## Authentication and User Management

- [x] 4. Implement authentication system
  - [x] 4.1 Create user registration and login backend endpoints
    - Write User entity with password hashing using bcrypt
    - Implement JWT token generation with access and refresh tokens
    - Create POST /auth/register endpoint with validation
    - Create POST /auth/login endpoint with rate limiting
    - Create POST /auth/refresh endpoint for token renewal
    - Create POST /auth/logout endpoint
    - _Requirements: 10.1, 10.2_
  
  - [x] 4.2 Implement authentication guards and middleware
    - Create JWT authentication guard for protected routes
    - Create role-based authorization guard (customer, admin)
    - Implement request user decorator for accessing current user
    - Add authentication middleware to NestJS app
    - _Requirements: 10.2_
  
  - [x] 4.3 Build frontend authentication UI and logic
    - Create login page with form validation
    - Create registration page with password strength indicator
    - Implement authentication context/provider for state management
    - Create protected route wrapper component
    - Implement token refresh logic with axios interceptors
    - Store tokens securely (httpOnly cookies or secure storage)
    - _Requirements: 10.1, 10.2_

- [x] 5. Implement user profile management
  - [x] 5.1 Create user profile backend endpoints
    - Create GET /users/profile endpoint
    - Create PUT /users/profile endpoint with validation
    - Create PUT /users/password endpoint with old password verification
    - Create Address entity and relationships
    - Create CRUD endpoints for user addresses
    - _Requirements: 10.3, 10.4, 10.5_
  
  - [x] 5.2 Build user profile frontend pages
    - Create account dashboard page layout
    - Create profile edit form with validation
    - Create password change form
    - Create address management interface (add, edit, delete, set default)
    - Implement form submission with error handling
    - _Requirements: 10.3, 10.4, 10.5_

## Product Catalog System

- [x] 6. Implement category management
  - [x] 6.1 Create category backend functionality
    - Write Category entity with bilingual fields (nameEn, nameVi)
    - Implement hierarchical category structure (parent-child relationships)
    - Create GET /categories endpoint returning category tree
    - Create admin endpoints for category CRUD operations
    - _Requirements: 1.2, 1.3_
  
  - [x] 6.2 Build category navigation UI
    - Create CategoryNav component with dropdown/mega menu
    - Implement category page with product listings
    - Create breadcrumb component for navigation
    - Add category filtering to product listings
    - _Requirements: 1.2, 1.3_

- [x] 7. Implement product catalog
  - [x] 7.1 Create product backend functionality
    - Write Product entity with bilingual fields and relationships
    - Write ProductImage entity for multiple product images
    - Create GET /products endpoint with pagination, filtering, and sorting
    - Create GET /products/:slug endpoint for product details
    - Implement full-text search on product name and description
    - Create admin endpoints for product CRUD operations
    - _Requirements: 1.1, 1.4, 2.2, 2.3, 2.4, 7.1, 7.2_
  
  - [x] 7.2 Implement product image upload
    - Configure multer or similar for file uploads
    - Implement image validation (type, size)
    - Create POST /products/:id/images endpoint
    - Integrate with AWS S3 or local storage
    - Generate image thumbnails for performance
    - _Requirements: 7.1_
  
  - [x] 7.3 Build product listing pages
    - Create product grid component with responsive layout
    - Create product card component displaying image, title, price
    - Implement products listing page with pagination
    - Add loading states and skeleton screens
    - Implement "out of stock" badge display
    - _Requirements: 1.1, 6.2_
  
  - [x] 7.4 Build product detail page
    - Create product detail page layout
    - Implement image gallery with zoom and thumbnails
    - Display product information (description, price, stock status)
    - Add quantity selector and add to cart button
    - Show related products section
    - Implement locale-based content display
    - _Requirements: 1.4, 1.5_
  
  - [x] 7.5 Implement search and filtering UI
    - Create search bar component with autocomplete
    - Implement search results page
    - Create filter panel with price range, category, availability filters
    - Add sort dropdown (price, name, newest)
    - Implement filter state management with URL params
    - Add clear filters functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

## Shopping Cart System

- [x] 8. Implement shopping cart functionality
  - [x] 8.1 Create cart backend functionality
    - Write Cart and CartItem entities
    - Implement cart storage in Redis for performance
    - Create GET /cart endpoint (session-based or user-based)
    - Create POST /cart/items endpoint to add items
    - Create PUT /cart/items/:id endpoint to update quantity
    - Create DELETE /cart/items/:id endpoint to remove items
    - Implement cart expiration logic
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 8.2 Build cart UI components
    - Create cart page with item list
    - Create cart item component with quantity controls and remove button
    - Create cart summary component showing subtotal and total
    - Implement mini cart drawer/dropdown in header
    - Add cart icon with item count badge
    - Implement optimistic UI updates for cart operations
    - _Requirements: 3.1, 3.3, 3.4, 3.5_
  
  - [x] 8.3 Implement cart persistence
    - Store guest cart in localStorage with session ID
    - Merge guest cart with user cart on login
    - Sync cart state across browser tabs
    - Implement cart recovery for abandoned carts
    - _Requirements: 3.2_

## Checkout and Payment System

- [ ] 9. Implement checkout process
  - [ ] 9.1 Create order backend functionality
    - Write Order and OrderItem entities
    - Create POST /orders endpoint to create orders
    - Implement order number generation
    - Create GET /orders and GET /orders/:id endpoints
    - Implement inventory deduction on order creation
    - Create order status update endpoint for admins
    - _Requirements: 4.5, 6.3, 6.4_
  
  - [ ] 9.2 Build checkout flow UI
    - Create multi-step checkout page (shipping, payment, review)
    - Implement checkout stepper component
    - Create shipping address form (with saved addresses for logged-in users)
    - Create shipping method selection with cost display
    - Implement guest checkout flow
    - Add order review step showing all details
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 9.3 Implement shipping calculation
    - Create shipping rate calculation logic
    - Integrate with shipping provider API for real-time rates (optional)
    - Create POST /shipping/calculate endpoint
    - Display shipping options in checkout
    - _Requirements: 4.3, 18.1_

- [ ] 10. Integrate payment gateway
  - [ ] 10.1 Set up Stripe integration
    - Install Stripe SDK in backend
    - Configure Stripe API keys
    - Create POST /payments/intent endpoint
    - Implement payment intent creation with order details
    - Create POST /payments/webhook endpoint for Stripe events
    - Implement webhook signature verification
    - Handle payment success and failure events
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 18.3_
  
  - [ ] 10.2 Build payment UI
    - Install Stripe Elements in frontend
    - Create payment form component with card input
    - Implement 3D Secure authentication flow
    - Handle payment errors and display user-friendly messages
    - Show payment processing loader
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 10.3 Create order confirmation
    - Create order success page displaying order number and details
    - Implement order confirmation email sending
    - Clear cart after successful order
    - Redirect to order confirmation page
    - _Requirements: 4.5_

## Wishlist Feature

- [ ] 11. Implement wishlist functionality
  - [ ] 11.1 Create wishlist backend
    - Write Wishlist and WishlistItem entities
    - Create GET /wishlist endpoint
    - Create POST /wishlist/items endpoint
    - Create DELETE /wishlist/items/:id endpoint
    - _Requirements: 11.1, 11.2, 11.3, 11.5_
  
  - [ ] 11.2 Build wishlist UI
    - Create wishlist page with product grid
    - Add "Add to Wishlist" button on product cards and detail page
    - Implement remove from wishlist functionality
    - Add "Move to Cart" button for wishlist items
    - Show wishlist icon state (added/not added)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

## Product Review System

- [ ] 12. Implement product reviews
  - [ ] 12.1 Create review backend functionality
    - Write Review entity with user and product relationships
    - Create GET /products/:id/reviews endpoint with pagination
    - Create POST /products/:id/reviews endpoint (requires purchase verification)
    - Create PUT /reviews/:id and DELETE /reviews/:id endpoints
    - Create POST /reviews/:id/helpful endpoint
    - Calculate and cache average product ratings
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 12.2 Build review UI components
    - Create review list component on product detail page
    - Create review form with star rating input and text area
    - Display average rating and rating distribution
    - Implement review sorting (most recent, most helpful)
    - Add "Mark as helpful" button
    - Show verified purchase badge
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

## Admin Panel - Product and Inventory Management

- [ ] 13. Build admin product management
  - [ ] 13.1 Create admin layout and navigation
    - Create admin layout component with sidebar navigation
    - Implement admin route protection
    - Create admin dashboard page
    - _Requirements: 6.3, 6.4, 7.1, 7.2_
  
  - [ ] 13.2 Build product management interface
    - Create product list page with search and filters
    - Create product form for creating/editing products
    - Implement bilingual content input (tabs or side-by-side)
    - Add image upload interface with preview and reordering
    - Create category selection dropdown
    - Add inventory quantity input with low stock warning
    - Implement product delete with confirmation
    - _Requirements: 6.1, 7.1, 7.2_
  
  - [ ] 13.3 Build category management interface
    - Create category list page with tree view
    - Create category form for creating/editing categories
    - Implement drag-and-drop for category reordering
    - Add category image upload
    - _Requirements: 1.2_

## Admin Panel - Order Management

- [ ] 14. Build admin order management
  - [ ] 14.1 Create order management interface
    - Create order list page with filters (status, date range)
    - Create order detail page showing all order information
    - Implement order status update dropdown
    - Add order search by order number or customer email
    - Display customer and shipping information
    - _Requirements: 6.3, 6.4_
  
  - [ ] 14.2 Implement refund processing
    - Create refund initiation interface
    - Integrate with Stripe refund API
    - Update order status to refunded
    - Send refund confirmation email
    - _Requirements: 6.5_
  
  - [ ] 14.3 Implement shipping label generation
    - Create shipping label generation interface
    - Integrate with shipping provider API
    - Store tracking number with order
    - Send shipping notification email to customer
    - _Requirements: 18.2_

## Admin Panel - Promotions and Discounts

- [ ] 15. Implement promotion system
  - [ ] 15.1 Create promotion backend functionality
    - Write Promotion entity
    - Create admin endpoints for promotion CRUD
    - Create POST /promotions/validate endpoint
    - Implement discount calculation logic (percentage, fixed)
    - Validate promotion constraints (min order, usage limits, dates)
    - Track promotion usage count
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [ ] 15.2 Build promotion management UI
    - Create promotion list page
    - Create promotion form with all configuration options
    - Add date range picker for validity period
    - Implement usage limit inputs
    - Show promotion usage statistics
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ] 15.3 Integrate promotions in checkout
    - Add discount code input field in cart/checkout
    - Implement discount code validation on frontend
    - Display discount amount in order summary
    - Show error messages for invalid codes
    - Apply discount to order total
    - _Requirements: 15.4_
  
  - [ ] 15.4 Create promotional banner system
    - Write Banner entity for homepage/category banners
    - Create admin interface for banner management
    - Implement banner display on frontend
    - Add banner image upload
    - _Requirements: 15.5_

## Content Management System

- [ ] 16. Implement CMS for static pages
  - [ ] 16.1 Create content backend functionality
    - Write Content entity with bilingual fields
    - Create admin endpoints for content CRUD
    - Create GET /content/pages/:slug endpoint
    - Implement content publishing workflow
    - _Requirements: 7.3, 7.4, 7.5_
  
  - [ ] 16.2 Build CMS admin interface
    - Create content list page
    - Create content editor with rich text editor (TipTap or similar)
    - Implement bilingual content editing
    - Add content preview functionality
    - Create publish/unpublish toggle
    - _Requirements: 7.3, 7.4_
  
  - [ ] 16.3 Create static pages
    - Create dynamic page route for CMS content
    - Create FAQ page with accordion component
    - Create contact page with contact form
    - Create about page
    - Create privacy policy, terms of service, shipping policy, returns policy pages
    - _Requirements: 17.1, 17.3, 17.4, 19.1, 19.2, 19.3, 19.4_
  
  - [ ] 16.4 Implement contact form
    - Create POST /contact endpoint
    - Implement email sending for contact form submissions
    - Add form validation and spam protection
    - Show success message after submission
    - _Requirements: 17.1, 17.2_

## Analytics and Reporting

- [ ] 17. Implement analytics system
  - [ ] 17.1 Create analytics tracking backend
    - Write AnalyticsEvent entity
    - Create POST /analytics/events endpoint
    - Implement event tracking for page views, product views, add to cart, purchases
    - Create analytics aggregation queries
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [ ] 17.2 Build analytics dashboard
    - Create admin analytics dashboard page
    - Display sales revenue charts (daily, weekly, monthly)
    - Show product performance metrics (views, conversion rate)
    - Display inventory alerts for low stock
    - Show cart abandonment rate
    - Implement date range selector for reports
    - _Requirements: 14.1, 14.2, 14.4, 14.5_
  
  - [ ] 17.3 Integrate Google Analytics
    - Install Google Analytics 4 or Google Tag Manager
    - Implement event tracking for e-commerce events
    - Track enhanced e-commerce data
    - _Requirements: 14.2, 14.3_

## SEO Optimization

- [ ] 18. Implement SEO features
  - [ ] 18.1 Configure meta tags and Open Graph
    - Create SEO component for dynamic meta tags
    - Implement meta title and description for all pages
    - Add Open Graph tags for social sharing
    - Add Twitter Card tags
    - Implement locale-specific meta tags
    - _Requirements: 16.1, 16.2_
  
  - [ ] 18.2 Implement structured data
    - Add Product schema markup to product pages
    - Add Breadcrumb schema to navigation
    - Add Organization schema to homepage
    - Add Review schema to product reviews
    - _Requirements: 16.4_
  
  - [ ] 18.3 Create sitemap and robots.txt
    - Implement XML sitemap generation endpoint
    - Include all public pages in sitemap
    - Create robots.txt file
    - Add canonical URL tags
    - _Requirements: 16.3, 16.5_

## Performance and Optimization

- [ ] 19. Implement caching strategies
  - [ ] 19.1 Configure Redis caching
    - Set up Redis connection in NestJS
    - Implement cache interceptor for frequently accessed data
    - Cache product catalog data
    - Cache category tree
    - Implement cache invalidation on updates
    - _Requirements: 2.5, 9.2_
  
  - [ ] 19.2 Optimize frontend performance
    - Implement Next.js Image component for all images
    - Configure image optimization and lazy loading
    - Implement code splitting for heavy components
    - Use dynamic imports for admin pages
    - Implement SWR or React Query for data fetching and caching
    - _Requirements: 8.4, 9.2_
  
  - [ ] 19.3 Optimize database queries
    - Add database indexes on frequently queried columns
    - Optimize N+1 query problems with eager loading
    - Implement database query result caching
    - _Requirements: 2.5_

## Security Implementation

- [ ] 20. Implement security measures
  - [ ] 20.1 Configure HTTPS and SSL
    - Set up SSL certificates
    - Configure HTTPS redirect
    - Implement HSTS headers
    - _Requirements: 9.1, 20.2_
  
  - [ ] 20.2 Implement security best practices
    - Configure CORS with whitelist
    - Implement rate limiting on all endpoints
    - Add helmet.js for security headers
    - Implement CSRF protection
    - Add input sanitization and validation
    - Implement SQL injection protection with parameterized queries
    - _Requirements: 9.3_
  
  - [ ] 20.3 Implement data encryption
    - Encrypt sensitive user data in database
    - Secure password storage with bcrypt
    - Implement secure session management
    - _Requirements: 9.4_

## Accessibility Implementation

- [ ] 21. Implement accessibility features
  - [ ] 21.1 Add semantic HTML and ARIA labels
    - Use semantic HTML elements throughout
    - Add ARIA labels to interactive elements
    - Implement ARIA live regions for dynamic content
    - Add alt text to all images
    - _Requirements: 13.1, 13.4_
  
  - [ ] 21.2 Implement keyboard navigation
    - Ensure all interactive elements are keyboard accessible
    - Add visible focus indicators
    - Implement skip navigation links
    - Test tab order and focus management
    - _Requirements: 13.2_
  
  - [ ] 21.3 Ensure color contrast and visual accessibility
    - Verify color contrast ratios meet WCAG AA standards
    - Ensure text is resizable
    - Don't rely on color alone for information
    - Test with screen readers
    - _Requirements: 13.3, 13.5_

## Email Notifications

- [ ] 22. Implement email notification system
  - [ ] 22.1 Set up email service integration
    - Configure SendGrid or AWS SES
    - Create email templates for different notification types
    - Implement bilingual email templates
    - _Requirements: 4.5, 17.2, 18.4_
  
  - [ ] 22.2 Implement order-related emails
    - Send order confirmation email
    - Send shipping notification email
    - Send order status update emails
    - _Requirements: 4.5_
  
  - [ ] 22.3 Implement user account emails
    - Send welcome email on registration
    - Send password reset email
    - Send email verification email
    - _Requirements: 10.1_

## Mobile Responsiveness

- [ ] 23. Ensure mobile responsiveness
  - [ ] 23.1 Implement responsive layouts
    - Create responsive grid layouts with TailwindCSS
    - Implement mobile navigation menu (hamburger menu)
    - Ensure touch-friendly tap targets (minimum 44px)
    - Test on various screen sizes (320px to 2560px)
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 23.2 Optimize mobile performance
    - Optimize images for mobile devices
    - Implement lazy loading for below-the-fold content
    - Test page load times on 4G connections
    - Ensure functionality on iOS and Android browsers
    - _Requirements: 8.4, 8.5_

## Deployment and DevOps

- [ ] 24. Set up deployment infrastructure
  - [ ] 24.1 Create Docker configurations
    - Write Dockerfile for Next.js frontend
    - Write Dockerfile for NestJS backend
    - Create production Docker Compose file
    - Configure environment variables
    - _Requirements: 20.3, 20.5_
  
  - [ ] 24.2 Set up CI/CD pipeline
    - Configure GitHub Actions or similar CI/CD
    - Add linting and type checking steps
    - Add automated testing steps
    - Implement automated deployment to staging
    - Implement production deployment workflow
    - _Requirements: 20.5_
  
  - [ ] 24.3 Configure production environment
    - Set up managed PostgreSQL database
    - Set up managed Redis instance
    - Configure CDN for static assets
    - Set up domain and DNS configuration
    - Implement automated database backups
    - _Requirements: 20.1, 20.3, 20.4_
  
  - [ ] 24.4 Implement monitoring and logging
    - Set up error tracking with Sentry
    - Configure application performance monitoring
    - Set up uptime monitoring
    - Implement centralized logging
    - Configure alerts for critical issues
    - _Requirements: 9.5_

## Testing

- [ ] 25. Write automated tests
  - [ ] 25.1 Write backend unit tests
    - Write unit tests for authentication service
    - Write unit tests for product service
    - Write unit tests for order service
    - Write unit tests for payment service
    - Target 80% code coverage
    - _Requirements: All_
  
  - [ ] 25.2 Write backend integration tests
    - Write API integration tests for authentication endpoints
    - Write API integration tests for product endpoints
    - Write API integration tests for order endpoints
    - Write API integration tests for payment endpoints
    - _Requirements: All_
  
  - [ ] 25.3 Write frontend unit tests
    - Write unit tests for key components (ProductCard, CartItem, etc.)
    - Write unit tests for utility functions
    - Write unit tests for custom hooks
    - Target 70% code coverage
    - _Requirements: All_
  
  - [ ] 25.4 Write E2E tests
    - Write E2E test for product browsing and search
    - Write E2E test for add to cart and checkout flow
    - Write E2E test for user registration and login
    - Write E2E test for admin product management
    - _Requirements: All_

## Documentation

- [ ] 26. Create project documentation
  - [ ] 26.1 Write API documentation
    - Document all API endpoints with request/response examples
    - Create Swagger/OpenAPI specification
    - Document authentication flow
    - _Requirements: All_
  
  - [ ] 26.2 Write deployment documentation
    - Document environment setup steps
    - Document deployment process
    - Create troubleshooting guide
    - _Requirements: 20.5_
  
  - [ ] 26.3 Write user documentation
    - Create admin user guide
    - Document common workflows
    - Create FAQ for administrators
    - _Requirements: All_
