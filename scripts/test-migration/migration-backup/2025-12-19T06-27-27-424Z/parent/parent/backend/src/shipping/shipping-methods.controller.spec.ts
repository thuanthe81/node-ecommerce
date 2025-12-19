import { Test, TestingModule } from '@nestjs/testing';
import { ShippingMethodsController } from './shipping-methods.controller';
import { ShippingMethodsService } from './shipping-methods.service';

describe('ShippingMethodsController', () => {
  let controller: ShippingMethodsController;
  let service: ShippingMethodsService;

  const mockShippingMethodsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllActive: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingMethodsController],
      providers: [
        {
          provide: ShippingMethodsService,
          useValue: mockShippingMethodsService,
        },
      ],
    }).compile();

    controller = module.get<ShippingMethodsController>(
      ShippingMethodsController,
    );
    service = module.get<ShippingMethodsService>(ShippingMethodsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a shipping method', async () => {
      const createDto = {
        methodId: 'test-method',
        nameEn: 'Test Method',
        nameVi: 'Phương thức thử nghiệm',
        descriptionEn: 'Test description',
        descriptionVi: 'Mô tả thử nghiệm',
        baseRate: 10.0,
        estimatedDaysMin: 3,
        estimatedDaysMax: 5,
      };

      const expectedResult = { id: '1', ...createDto };
      mockShippingMethodsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all shipping methods', async () => {
      const expectedResult = [
        { id: '1', methodId: 'standard', nameEn: 'Standard' },
        { id: '2', methodId: 'express', nameEn: 'Express' },
      ];
      mockShippingMethodsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAllActive', () => {
    it('should return only active shipping methods', async () => {
      const expectedResult = [
        { id: '1', methodId: 'standard', nameEn: 'Standard', isActive: true },
      ];
      mockShippingMethodsService.findAllActive.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findAllActive();

      expect(service.findAllActive).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single shipping method', async () => {
      const expectedResult = {
        id: '1',
        methodId: 'standard',
        nameEn: 'Standard',
      };
      mockShippingMethodsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a shipping method', async () => {
      const updateDto = { nameEn: 'Updated Name' };
      const expectedResult = {
        id: '1',
        methodId: 'standard',
        nameEn: 'Updated Name',
      };
      mockShippingMethodsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a shipping method', async () => {
      const expectedResult = { id: '1', methodId: 'standard' };
      mockShippingMethodsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedResult);
    });
  });
});
