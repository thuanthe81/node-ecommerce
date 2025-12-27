import { Test, TestingModule } from '@nestjs/testing';
import { CsrfController } from '../src/common/controllers/csrf.controller';
import type { Request, Response } from 'express';

describe('CsrfController', () => {
  let controller: CsrfController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CsrfController],
    }).compile();

    controller = module.get<CsrfController>(CsrfController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return CSRF token', () => {
    const mockRequest = {
      csrfToken: jest.fn().mockReturnValue('test-csrf-token'),
    } as unknown as Request;

    const mockResponse = {
      json: jest.fn(),
    } as unknown as Response;

    controller.getCsrfToken(mockRequest, mockResponse);

    expect(mockRequest.csrfToken).toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalledWith({
      csrfToken: 'test-csrf-token',
      message: 'CSRF token generated successfully',
    });
  });
});