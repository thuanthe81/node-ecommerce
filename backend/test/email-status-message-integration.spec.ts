/**
 * Integration test for email status message functionality
 * Tests that status messages are properly generated from shared package
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getOrderStatusMessage, getPaymentStatusMessage, OrderStatus, PaymentStatus } from '@alacraft/shared';

describe('Email Status Message Integration', () => {
  describe('Shared Package Integration', () => {
    test('should import status message functions from shared package', () => {
      expect(getOrderStatusMessage).toBeDefined();
      expect(getPaymentStatusMessage).toBeDefined();
      expect(typeof getOrderStatusMessage).toBe('function');
      expect(typeof getPaymentStatusMessage).toBe('function');
    });

    test('should generate order status messages in English', () => {
      const pendingMessage = getOrderStatusMessage(OrderStatus.PENDING, 'en');
      const processingMessage = getOrderStatusMessage(OrderStatus.PROCESSING, 'en');
      const shippedMessage = getOrderStatusMessage(OrderStatus.SHIPPED, 'en');
      const deliveredMessage = getOrderStatusMessage(OrderStatus.DELIVERED, 'en');

      expect(pendingMessage).toBe('Your order has been received and is awaiting processing.');
      expect(processingMessage).toBe('Your order is being prepared for shipment. We will notify you once it ships.');
      expect(shippedMessage).toBe('Your order has been shipped and is on its way to you.');
      expect(deliveredMessage).toBe('Your order has been successfully delivered. Thank you for your business!');
    });

    test('should generate order status messages in Vietnamese', () => {
      const pendingMessage = getOrderStatusMessage(OrderStatus.PENDING, 'vi');
      const processingMessage = getOrderStatusMessage(OrderStatus.PROCESSING, 'vi');
      const shippedMessage = getOrderStatusMessage(OrderStatus.SHIPPED, 'vi');
      const deliveredMessage = getOrderStatusMessage(OrderStatus.DELIVERED, 'vi');

      expect(pendingMessage).toBe('Đơn hàng của bạn đã được nhận và đang chờ xử lý.');
      expect(processingMessage).toBe('Đơn hàng của bạn đang được chuẩn bị để giao hàng. Chúng tôi sẽ thông báo cho bạn khi nó được giao.');
      expect(shippedMessage).toBe('Đơn hàng của bạn đã được giao và đang trên đường đến với bạn.');
      expect(deliveredMessage).toBe('Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua hàng!');
    });

    test('should generate payment status messages in English', () => {
      const pendingMessage = getPaymentStatusMessage(PaymentStatus.PENDING, 'en');
      const paidMessage = getPaymentStatusMessage(PaymentStatus.PAID, 'en');
      const failedMessage = getPaymentStatusMessage(PaymentStatus.FAILED, 'en');
      const refundedMessage = getPaymentStatusMessage(PaymentStatus.REFUNDED, 'en');

      expect(pendingMessage).toBe('Your payment is being processed. We will update you once the payment is confirmed.');
      expect(paidMessage).toBe('Your payment has been successfully processed. Thank you for your payment!');
      expect(failedMessage).toBe('Your payment could not be processed. Please try again or contact us for assistance.');
      expect(refundedMessage).toBe('Your payment has been refunded. The refund will appear in your original payment method within 3-5 business days.');
    });

    test('should generate payment status messages in Vietnamese', () => {
      const pendingMessage = getPaymentStatusMessage(PaymentStatus.PENDING, 'vi');
      const paidMessage = getPaymentStatusMessage(PaymentStatus.PAID, 'vi');
      const failedMessage = getPaymentStatusMessage(PaymentStatus.FAILED, 'vi');
      const refundedMessage = getPaymentStatusMessage(PaymentStatus.REFUNDED, 'vi');

      expect(pendingMessage).toBe('Thanh toán của bạn đang được xử lý. Chúng tôi sẽ cập nhật cho bạn khi thanh toán được xác nhận.');
      expect(paidMessage).toBe('Thanh toán của bạn đã được xử lý thành công. Cảm ơn bạn đã thanh toán!');
      expect(failedMessage).toBe('Thanh toán của bạn không thể được xử lý. Vui lòng thử lại hoặc liên hệ với chúng tôi để được hỗ trợ.');
      expect(refundedMessage).toBe('Thanh toán của bạn đã được hoàn lại. Tiền hoàn sẽ xuất hiện trong phương thức thanh toán gốc của bạn trong vòng 3-5 ngày làm việc.');
    });

    test('should fallback to English when locale is not provided', () => {
      const orderMessage = getOrderStatusMessage(OrderStatus.PENDING);
      const paymentMessage = getPaymentStatusMessage(PaymentStatus.PAID);

      expect(orderMessage).toBe('Your order has been received and is awaiting processing.');
      expect(paymentMessage).toBe('Your payment has been successfully processed. Thank you for your payment!');
    });

    test('should handle unknown statuses gracefully', () => {
      const unknownOrderMessage = getOrderStatusMessage('UNKNOWN_STATUS' as any, 'en');
      const unknownPaymentMessage = getPaymentStatusMessage('INVALID_STATUS' as any, 'en');

      expect(unknownOrderMessage).toBe('UNKNOWN_STATUS');
      expect(unknownPaymentMessage).toBe('INVALID_STATUS');
    });
  });
});