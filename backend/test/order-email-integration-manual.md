# Order Email Integration Testing Guide

This document provides comprehensive testing procedures for the order email bug fix implementation, covering both complete order flow with email delivery and deduplication under concurrent load.

## Requirements Tested

- **2.5**: End-to-end single email delivery per order
- **4.5**: HTML formatting verification in multiple email clients
- **2.4**: Deduplication under concurrent load
- **4.4**: Deduplication logging and monitoring

## Prerequisites

1. Backend server running (`npm run start:dev`)
2. Database with test data (products, categories)
3. Email queue service running
4. Redis running for email queue
5. Test mode enabled for comprehensive logging

## Test Suite 7.1: Complete Order Flow with Email Delivery

### Test 1: Standard Order Creation and Email Delivery

**Objective**: Verify that creating an order sends exactly one confirmation email.

**Steps**:
1. Enable email testing utilities:
   ```typescript
   EmailTestingUtils.enableTestMode(['test-order-id']);
   ```

2. Create a test order using the API or service:
   ```bash
   curl -X POST http://localhost:3001/api/orders \
     -H "Content-Type: application/json" \
     -d '{
       "email": "standard-test@example.com",
       "shippingAddressId": "address-id",
       "billingAddressId": "address-id",
       "items": [{"productId": "product-id", "quantity": 1}],
       "shippingMethod": "standard",
       "shippingCost": 5.00,
       "paymentMethod": "credit_card"
     }'
   ```

3. Wait 5-10 seconds for email processing

4. Verify email count:
   ```typescript
   const emailCount = EmailTestingUtils.countEmailsForOrder(orderId);
   expect(emailCount).toBe(1);
   ```

5. Check test report:
   ```typescript
   const report = EmailTestingUtils.getTestReport(orderId);
   expect(report.status).toBe('SUCCESS');
   ```

**Expected Results**:
- Exactly 1 email sent
- Test report shows SUCCESS status
- No duplicate email warnings in logs

### Test 2: Special Characters in Customer Data

**Objective**: Verify HTML escaping works correctly with special characters.

**Test Cases**:
1. Vietnamese characters: `Nguyễn Văn Đức`
2. Spanish characters: `José María García-López`
3. Special symbols: `O'Connor & Sons Ltd.`
4. HTML-like content: `"Main Street" <Building A>`

**Steps**:
1. Create orders with each test case
2. Monitor email generation logs for HTML escaping
3. Verify email content formatting:
   ```typescript
   const verification = EmailTestingUtils.verifyEmailContentFormatting(
     htmlContent, textContent, subject, orderId
   );
   expect(verification.isValid).toBe(true);
   expect(verification.checks.htmlEscaping).toBe(true);
   ```

**Expected Results**:
- All special characters properly escaped in HTML
- No raw HTML or unescaped characters in email content
- CSS formatting clean without artifacts

### Test 3: Email Client Compatibility

**Objective**: Verify email formatting works across different email clients.

**Test Scenarios**:
1. **Gmail Web Client**: Supports modern CSS, long lines
2. **Outlook Desktop**: Limited CSS support, short lines
3. **Apple Mail**: Good CSS support
4. **Mobile Clients**: Responsive design considerations

**Steps**:
1. Generate mock email content for each client scenario
2. Run formatting verification for each:
   ```typescript
   const scenarios = [
     { name: 'Gmail', maxLineLength: 998, supportsCSSGrid: true },
     { name: 'Outlook', maxLineLength: 76, supportsCSSGrid: false }
   ];

   scenarios.forEach(scenario => {
     const content = generateEmailContent(customerData, scenario);
     const verification = EmailTestingUtils.verifyEmailContentFormatting(content);
     expect(verification.isValid).toBe(true);
   });
   ```

**Expected Results**:
- Email renders correctly in all client scenarios
- No CSS compatibility warnings
- Proper line length handling

### Test 4: Vietnamese Locale Support

**Objective**: Verify Vietnamese locale emails work correctly.

**Steps**:
1. Create order with Vietnamese locale:
   ```typescript
   const order = await ordersService.create(orderData, 'vi');
   ```

2. Verify Vietnamese content formatting
3. Check character encoding for Vietnamese text

**Expected Results**:
- Vietnamese characters display correctly
- Proper HTML escaping for Vietnamese text
- Correct email subject in Vietnamese

## Test Suite 7.2: Deduplication Under Concurrent Load

### Test 1: Concurrent Order Creation

**Objective**: Verify no duplicate emails when creating multiple concurrent orders.

**Steps**:
1. Enable test mode for multiple orders
2. Create 5 orders concurrently:
   ```typescript
   const orderPromises = [];
   for (let i = 0; i < 5; i++) {
     orderPromises.push(createOrder(`concurrent-${i}@example.com`));
   }
   const orders = await Promise.all(orderPromises);
   ```

3. Wait for email processing (10 seconds)
4. Verify each order has exactly 1 email
5. Check total email count matches order count

**Expected Results**:
- Each order receives exactly 1 email
- No duplicate email warnings
- Total emails = total orders

### Test 2: Rapid Successive Orders

**Objective**: Test deduplication with rapid order creation.

**Steps**:
1. Create orders in rapid succession (100ms apart)
2. Monitor deduplication logs
3. Verify email counts

**Expected Results**:
- Each order gets 1 email despite rapid creation
- Deduplication logic handles timing correctly

### Test 3: Deduplication Logging Verification

**Objective**: Verify deduplication logging and monitoring works.

**Steps**:
1. Create test order
2. Check test report for deduplication evidence:
   ```typescript
   const report = EmailTestingUtils.getTestReport(orderId);
   expect(report.isInTestMode).toBe(true);
   expect(report.recommendations).toContain('Email count is correct');
   ```

3. Review application logs for deduplication entries

**Expected Results**:
- Clear logging of email events
- Deduplication status visible in logs
- Test mode provides comprehensive details

### Test 4: Same Customer Multiple Orders

**Objective**: Verify deduplication works per-order, not per-customer.

**Steps**:
1. Create multiple orders for same customer email
2. Verify each order gets its own confirmation email
3. Check email tracking per order ID

**Expected Results**:
- Each order gets separate confirmation
- No cross-order deduplication
- Proper order ID tracking

### Test 5: Performance Under Load

**Objective**: Monitor email queue performance with multiple orders.

**Steps**:
1. Record start time
2. Create 10 orders rapidly
3. Monitor email processing time
4. Check performance metrics:
   ```typescript
   console.log(`Order creation time: ${creationTime}ms`);
   console.log(`Email processing time: ${processingTime}ms`);
   console.log(`Average per order: ${processingTime/orderCount}ms`);
   ```

**Expected Results**:
- Order creation < 30 seconds for 10 orders
- Email processing < 60 seconds total
- No performance degradation
- All emails delivered successfully

## Manual Testing Scripts

### Script 1: Basic Email Flow Test

```bash
#!/bin/bash
# Run basic email flow test
cd backend
npm run ts-node scripts/test-email-flow-comprehensive.ts
```

### Script 2: Load Testing

```bash
#!/bin/bash
# Run load testing for email deduplication
cd backend
npm run ts-node scripts/run-order-email-integration-tests.ts --suite performance
```

### Script 3: Special Characters Test

```bash
#!/bin/bash
# Test special characters handling
cd backend
npm run ts-node scripts/run-order-email-integration-tests.ts --suite special-characters
```

## Verification Checklist

### Email Delivery Verification
- [ ] Exactly 1 email per order
- [ ] No duplicate email warnings in logs
- [ ] Email content properly formatted
- [ ] Special characters escaped correctly
- [ ] CSS formatting clean

### Deduplication Verification
- [ ] Concurrent orders don't create duplicates
- [ ] Rapid successive orders handled correctly
- [ ] Deduplication logging working
- [ ] Per-order tracking accurate
- [ ] Performance acceptable under load

### Logging Verification
- [ ] Email events logged with timestamps
- [ ] Deduplication status visible
- [ ] Test mode provides detailed info
- [ ] Error conditions logged properly
- [ ] Performance metrics available

## Troubleshooting

### Common Issues

1. **No emails sent**: Check email queue service running
2. **Duplicate emails**: Review deduplication logic and timing
3. **HTML formatting issues**: Verify HTML escaping service
4. **Performance problems**: Check Redis connection and queue processing

### Debug Commands

```bash
# Check email queue status
curl http://localhost:3001/api/admin/email-queue/health

# View email logs
tail -f logs/application.log | grep "EMAIL_FLOW"

# Check Redis queue
redis-cli LLEN email_queue

# Monitor email processing
npm run ts-node scripts/monitor-email-queue.sh
```

## Success Criteria

The integration tests pass when:

1. **Single Email Delivery**: Every order generates exactly 1 confirmation email
2. **HTML Formatting**: All special characters properly escaped, CSS clean
3. **Email Client Compatibility**: Emails render correctly across different clients
4. **Deduplication**: No duplicate emails under any load conditions
5. **Performance**: Acceptable processing times under concurrent load
6. **Logging**: Comprehensive logging provides clear audit trail
7. **Monitoring**: Test utilities provide accurate reporting and metrics

This comprehensive testing approach ensures the order email bug fixes work correctly across all scenarios and load conditions.