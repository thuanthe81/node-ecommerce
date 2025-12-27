/**
 * Unit tests for Order API client cancellation functionality
 *
 * Tests the enhanced error handling for various cancellation failure scenarios:
 * - 400: Order not cancellable (wrong status)
 * - 401: Unauthorized (session expired)
 * - 403: Forbidden (access denied)
 * - 404: Order not found
 * - 429: Rate limited (too many requests)
 * - 500: Server error (processing failure)
 */

import { orderApi, OrderCancellationError, getCancellationErrorMessage } from '@/lib/order-api';
import apiClient from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Order API - cancelOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful cancellation', () => {
    it('should return order data when cancellation is successful', async () => {
      const mockResponse = {
        data: {
          order: { id: '123', status: 'CANCELLED' },
          message: 'Order cancelled successfully',
          emailSent: true,
        },
      };

      mockedApiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await orderApi.cancelOrder('123', { reason: 'Changed mind' });

      expect(mockedApiClient.patch).toHaveBeenCalledWith('/orders/123/cancel', { reason: 'Changed mind' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle cancellation without reason', async () => {
      const mockResponse = {
        data: {
          order: { id: '123', status: 'CANCELLED' },
          message: 'Order cancelled successfully',
          emailSent: true,
        },
      };

      mockedApiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await orderApi.cancelOrder('123');

      expect(mockedApiClient.patch).toHaveBeenCalledWith('/orders/123/cancel', {});
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Error handling scenarios', () => {
    it('should throw OrderCancellationError for 400 Bad Request (order not cancellable)', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            code: 'ORDER_NOT_CANCELLABLE',
            message: 'Order cannot be cancelled in current status',
            details: { currentStatus: 'SHIPPED' },
          },
        },
      };

      mockedApiClient.patch.mockRejectedValueOnce(mockError);

      try {
        await orderApi.cancelOrder('123');
        fail('Expected OrderCancellationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OrderCancellationError);
        expect((error as OrderCancellationError).status).toBe(400);
        expect((error as OrderCancellationError).code).toBe('ORDER_NOT_CANCELLABLE');
        expect((error as OrderCancellationError).message).toBe('Order cannot be cancelled in current status');
        expect((error as OrderCancellationError).details).toEqual({ currentStatus: 'SHIPPED' });
      }
    });

    it('should throw OrderCancellationError for 401 Unauthorized (session expired)', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            code: 'UNAUTHORIZED',
            message: 'Session expired',
          },
        },
      };

      mockedApiClient.patch.mockRejectedValueOnce(mockError);

      try {
        await orderApi.cancelOrder('123');
        fail('Expected OrderCancellationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OrderCancellationError);
        expect((error as OrderCancellationError).status).toBe(401);
        expect((error as OrderCancellationError).code).toBe('UNAUTHORIZED');
      }
    });

    it('should throw OrderCancellationError for 403 Forbidden (access denied)', async () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            code: 'ACCESS_DENIED',
            message: 'You do not have permission to cancel this order',
          },
        },
      };

      mockedApiClient.patch.mockRejectedValueOnce(mockError);

      try {
        await orderApi.cancelOrder('123');
        fail('Expected OrderCancellationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OrderCancellationError);
        expect((error as OrderCancellationError).status).toBe(403);
        expect((error as OrderCancellationError).code).toBe('ACCESS_DENIED');
      }
    });

    it('should throw OrderCancellationError for 404 Not Found (order not found)', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found',
          },
        },
      };

      mockedApiClient.patch.mockRejectedValueOnce(mockError);

      try {
        await orderApi.cancelOrder('123');
        fail('Expected OrderCancellationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OrderCancellationError);
        expect((error as OrderCancellationError).status).toBe(404);
        expect((error as OrderCancellationError).code).toBe('ORDER_NOT_FOUND');
      }
    });

    it('should throw OrderCancellationError for 429 Too Many Requests (rate limited)', async () => {
      const mockError = {
        response: {
          status: 429,
          data: {
            code: 'RATE_LIMITED',
            message: 'Too many cancellation requests',
          },
        },
      };

      mockedApiClient.patch.mockRejectedValueOnce(mockError);

      try {
        await orderApi.cancelOrder('123');
        fail('Expected OrderCancellationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OrderCancellationError);
        expect((error as OrderCancellationError).status).toBe(429);
        expect((error as OrderCancellationError).code).toBe('RATE_LIMITED');
      }
    });

    it('should throw OrderCancellationError for 500 Internal Server Error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error occurred',
          },
        },
      };

      mockedApiClient.patch.mockRejectedValueOnce(mockError);

      try {
        await orderApi.cancelOrder('123');
        fail('Expected OrderCancellationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OrderCancellationError);
        expect((error as OrderCancellationError).status).toBe(500);
        expect((error as OrderCancellationError).code).toBe('INTERNAL_ERROR');
      }
    });

    it('should handle network errors without response', async () => {
      const mockError = new Error('Network error');

      mockedApiClient.patch.mockRejectedValueOnce(mockError);

      try {
        await orderApi.cancelOrder('123');
        fail('Expected OrderCancellationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(OrderCancellationError);
        expect((error as OrderCancellationError).status).toBe(500);
        expect((error as OrderCancellationError).code).toBe('UNKNOWN_ERROR');
        expect((error as OrderCancellationError).message).toBe('An unexpected error occurred while cancelling the order');
      }
    });
  });
});

describe('getCancellationErrorMessage', () => {
  describe('English messages', () => {
    it('should return correct message for 400 Bad Request', () => {
      const mockError = new OrderCancellationError({
        status: 400,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'en');
      expect(message).toBe('This order cannot be cancelled. It may have already been processed or shipped.');
    });

    it('should return correct message for 401 Unauthorized', () => {
      const mockError = new OrderCancellationError({
        status: 401,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'en');
      expect(message).toBe('Your session has expired. Please refresh the page and try again.');
    });

    it('should return correct message for 403 Forbidden', () => {
      const mockError = new OrderCancellationError({
        status: 403,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'en');
      expect(message).toBe('You do not have permission to cancel this order.');
    });

    it('should return correct message for 404 Not Found', () => {
      const mockError = new OrderCancellationError({
        status: 404,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'en');
      expect(message).toBe('Order not found. Please check the order number and try again.');
    });

    it('should return correct message for 429 Too Many Requests', () => {
      const mockError = new OrderCancellationError({
        status: 429,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'en');
      expect(message).toBe('Too many cancellation requests. Please wait a moment before trying again.');
    });

    it('should return correct message for 500 Internal Server Error', () => {
      const mockError = new OrderCancellationError({
        status: 500,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'en');
      expect(message).toBe('A server error occurred while cancelling your order. Please try again or contact support.');
    });

    it('should return default message for unknown status codes', () => {
      const mockError = new OrderCancellationError({
        status: 999,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'en');
      expect(message).toBe('Failed to cancel order. Please try again or contact support if the problem persists.');
    });
  });

  describe('Vietnamese messages', () => {
    it('should return correct message for 400 Bad Request', () => {
      const mockError = new OrderCancellationError({
        status: 400,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'vi');
      expect(message).toBe('Không thể hủy đơn hàng này. Đơn hàng có thể đã được xử lý hoặc giao hàng.');
    });

    it('should return correct message for 401 Unauthorized', () => {
      const mockError = new OrderCancellationError({
        status: 401,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'vi');
      expect(message).toBe('Phiên làm việc đã hết hạn. Vui lòng làm mới trang và thử lại.');
    });

    it('should return correct message for 403 Forbidden', () => {
      const mockError = new OrderCancellationError({
        status: 403,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'vi');
      expect(message).toBe('Bạn không có quyền hủy đơn hàng này.');
    });

    it('should return correct message for 404 Not Found', () => {
      const mockError = new OrderCancellationError({
        status: 404,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'vi');
      expect(message).toBe('Không tìm thấy đơn hàng. Vui lòng kiểm tra số đơn hàng và thử lại.');
    });

    it('should return correct message for 429 Too Many Requests', () => {
      const mockError = new OrderCancellationError({
        status: 429,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'vi');
      expect(message).toBe('Quá nhiều yêu cầu hủy đơn. Vui lòng đợi một chút trước khi thử lại.');
    });

    it('should return correct message for 500 Internal Server Error', () => {
      const mockError = new OrderCancellationError({
        status: 500,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'vi');
      expect(message).toBe('Đã xảy ra lỗi máy chủ khi hủy đơn hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
    });

    it('should return default message for unknown status codes', () => {
      const mockError = new OrderCancellationError({
        status: 999,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError, 'vi');
      expect(message).toBe('Không thể hủy đơn hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.');
    });
  });

  describe('Default locale handling', () => {
    it('should default to English when no locale is provided', () => {
      const mockError = new OrderCancellationError({
        status: 400,
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      const message = getCancellationErrorMessage(mockError);
      expect(message).toBe('This order cannot be cancelled. It may have already been processed or shipped.');
    });
  });
});