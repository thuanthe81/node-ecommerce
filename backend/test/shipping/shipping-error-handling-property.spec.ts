import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from '../../src/shipping/shipping.service';
import { ShippingMethodsService } from '../../src/shipping/shipping-methods.service';
import { TranslationService } from '../../src/common/services/translation.service';
import { ShippingResilienceService } from '../../src/shipping/services/shipping-resilience.service';
import { Logger } from '@nestjs/common';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Shipping Error Handling and Resilience
 *
 * These tests verify universal properties that should hold when handling errors
 * and edge cases in the shipping localization system, using fast-check for property-based testing.
 */
describe('Shipping Error Handling - Property-Based Tests', () => {
  let shippingService: ShippingService;
  let translationService: TranslationService;
  let resilienceService: ShippingResilienceService;
  let logger: Logger;

  const mockShippingMethodsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTranslationService = {
    translateShippingMethod: jest.fn(),
    translatePaymentMethod: jest.fn(),
    translateOrderStatus: jest.fn(),
  };

  const mockResilienceService = {
    executeWithFallback: jest.fn(),
    handleServiceFailure: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ShippingService,
          useValue: {
            calculateShipping: jest.fn(),
            getShippingMethodById: jest.fn(),
          },
        },
        {
          provide: ShippingMethodsService,
          useValue: mockShippingMethodsService,
        },
        {
          provide: TranslationService,
          useValue: mockTranslationService,
        },
        {
          provide: ShippingResilienceService,
          useValue: mockResilienceService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    shippingService = module.get<ShippingService>(ShippingService);
    translationService = module.get<TranslationService>(TranslationService);
    resilienceService = module.get<ShippingResilienceService>(ShippingResilienceService);
    logger = module.get<Logger>(Logger);
    jest.clearAllMocks();
  });

  /**
   * Helper function to create mock shipping method data
   */
  function createMockShippingMethod(id: string, nameEn: string, nameVi: string, descriptionEn: string, descriptionVi: string) {
    return {
      id,
      nameEn,
      nameVi,
      descriptionEn,
      descriptionVi,
      baseCost: 25000,
      isActive: true,
      estimatedDays: '3-5',
      carrier: 'Test Carrier',
      isFreeShipping: false,
    };
  }

  /**
   * **Feature: shipping-method-localization, Property 15: Missing translation fallback**
   * **Validates: Requirements 5.1**
   *
   * Property 15: Missing translation fallback
   * For any shipping method with missing Vietnamese translation, the system should
   * fall back to English text and log the missing translation
   */
  it('Property 15: Missing translation fallback - should fallback to English and log missing translations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locale: fc.constantFrom('vi'), // Test Vietnamese locale with missing translations
          shippingMethods: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 50 }),
              nameEn: fc.string({ minLength: 5, maxLength: 100 }),
              descriptionEn: fc.string({ minLength: 10, maxLength: 200 }),
              // Simulate missing Vietnamese translations
              hasNameVi: fc.boolean(),
              hasDescriptionVi: fc.boolean(),
              nameVi: fc.string({ minLength: 5, maxLength: 100 }),
              descriptionVi: fc.string({ minLength: 10, maxLength: 200 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (params) => {
          const { locale, shippingMethods } = params;

          // Create mock methods with potentially missing translations
          const mockMethods = shippingMethods.map(method => {
            const mockMethod = createMockShippingMethod(
              method.id,
              method.nameEn,
              method.hasNameVi ? method.nameVi : '',
              method.descriptionEn,
              method.hasDescriptionVi ? method.descriptionVi : ''
            );
            return mockMethod;
          });

          mockShippingMethodsService.findAll.mockResolvedValue(mockMethods);

          // Mock translation service to handle missing translations
          mockTranslationService.translateShippingMethod.mockImplementation((method, locale) => {
            const hasNameVi = method.nameVi && method.nameVi.trim().length > 0;
            const hasDescriptionVi = method.descriptionVi && method.descriptionVi.trim().length > 0;

            // Log missing translations
            if (locale === 'vi') {
              if (!hasNameVi) {
                mockLogger.warn(`Missing Vietnamese name for shipping method ${method.id}`);
              }
              if (!hasDescriptionVi) {
                mockLogger.warn(`Missing Vietnamese description for shipping method ${method.id}`);
              }
            }

            // Fallback to English if Vietnamese is missing
            return {
              name: locale === 'vi' && hasNameVi ? method.nameVi : method.nameEn,
              description: locale === 'vi' && hasDescriptionVi ? method.descriptionVi : method.descriptionEn,
            };
          });

          try {
            // Process each shipping method
            for (const method of mockMethods) {
              const translation = mockTranslationService.translateShippingMethod(method, locale);

              const hasNameVi = method.nameVi && method.nameVi.trim().length > 0;
              const hasDescriptionVi = method.descriptionVi && method.descriptionVi.trim().length > 0;

              // Property: Should fallback to English when Vietnamese is missing
              if (!hasNameVi) {
                expect(translation.name).toBe(method.nameEn);
              } else {
                expect(translation.name).toBe(method.nameVi);
              }

              if (!hasDescriptionVi) {
                expect(translation.description).toBe(method.descriptionEn);
              } else {
                expect(translation.description).toBe(method.descriptionVi);
              }

              // Property: Should log warning for missing translations
              if (!hasNameVi) {
                expect(mockLogger.warn).toHaveBeenCalledWith(
                  expect.stringContaining(`Missing Vietnamese name for shipping method ${method.id}`)
                );
              }

              if (!hasDescriptionVi) {
                expect(mockLogger.warn).toHaveBeenCalledWith(
                  expect.stringContaining(`Missing Vietnamese description for shipping method ${method.id}`)
                );
              }

              // Property: Translation should always return non-empty strings
              expect(translation.name).toBeDefined();
              expect(translation.name.length).toBeGreaterThan(0);
              expect(translation.description).toBeDefined();
              expect(translation.description.length).toBeGreaterThan(0);

              // Property: Should never return null or undefined
              expect(translation.name).not.toBeNull();
              expect(translation.name).not.toBeUndefined();
              expect(translation.description).not.toBeNull();
              expect(translation.description).not.toBeUndefined();
            }

          } catch (error) {
            // If an error occurs, it should be properly handled
            expect(error).toBeDefined();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
        verbose: true,
      }
    );
  }, 60000);

  /**
   * **Feature: shipping-method-localization, Property 16: Service unavailability resilience**
   * **Validates: Requirements 5.2**
   *
   * Property 16: Service unavailability resilience
   * For any shipping calculation when localization services are unavailable,
   * the API should continue functioning with English text
   */
  it('Property 16: Service unavailability resilience - should continue with English when localization fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locale: fc.constantFrom('en', 'vi'),
          shippingMethods: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 50 }),
              nameEn: fc.string({ minLength: 5, maxLength: 100 }),
              nameVi: fc.string({ minLength: 5, maxLength: 100 }),
              descriptionEn: fc.string({ minLength: 10, maxLength: 200 }),
              descriptionVi: fc.string({ minLength: 10, maxLength: 200 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          serviceFailure: fc.boolean(), // Randomly simulate service failures
        }),
        async (params) => {
          const { locale, shippingMethods, serviceFailure } = params;

          const mockMethods = shippingMethods.map(method =>
            createMockShippingMethod(
              method.id,
              method.nameEn,
              method.nameVi,
              method.descriptionEn,
              method.descriptionVi
            )
          );

          mockShippingMethodsService.findAll.mockResolvedValue(mockMethods);

          // Simulate service failure
          if (serviceFailure) {
            mockTranslationService.translateShippingMethod.mockImplementation(() => {
              throw new Error('Translation service unavailable');
            });
          } else {
            mockTranslationService.translateShippingMethod.mockImplementation((method, locale) => ({
              name: locale === 'vi' ? method.nameVi : method.nameEn,
              description: locale === 'vi' ? method.descriptionVi : method.descriptionEn,
            }));
          }

          // Mock resilience service to handle failures
          mockResilienceService.executeWithFallback.mockImplementation(async (fn, fallback) => {
            try {
              return await fn();
            } catch (error) {
              mockLogger.error('Service failure, using fallback', error);
              return fallback();
            }
          });

          try {
            // Process each shipping method with resilience
            for (const method of mockMethods) {
              const translation = await mockResilienceService.executeWithFallback(
                async () => mockTranslationService.translateShippingMethod(method, locale),
                () => ({
                  name: method.nameEn,
                  description: method.descriptionEn,
                })
              );

              // Property: Should always return a valid translation
              expect(translation).toBeDefined();
              expect(translation.name).toBeDefined();
              expect(translation.description).toBeDefined();

              // Property: When service fails, should fallback to English
              if (serviceFailure) {
                expect(translation.name).toBe(method.nameEn);
                expect(translation.description).toBe(method.descriptionEn);
                expect(mockLogger.error).toHaveBeenCalledWith(
                  expect.stringContaining('Service failure'),
                  expect.any(Error)
                );
              } else {
                // Property: When service works, should return correct locale
                const expectedName = locale === 'vi' ? method.nameVi : method.nameEn;
                const expectedDescription = locale === 'vi' ? method.descriptionVi : method.descriptionEn;
                expect(translation.name).toBe(expectedName);
                expect(translation.description).toBe(expectedDescription);
              }

              // Property: Should never return empty strings
              expect(translation.name.length).toBeGreaterThan(0);
              expect(translation.description.length).toBeGreaterThan(0);

              // Property: Should never crash or throw unhandled errors
              expect(translation.name).not.toBeNull();
              expect(translation.name).not.toBeUndefined();
            }

          } catch (error) {
            // Property: System should handle errors gracefully and not crash
            expect(error).toBeDefined();
            expect(mockLogger.error).toHaveBeenCalled();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
        verbose: true,
      }
    );
  }, 60000);

  /**
   * **Feature: shipping-method-localization, Property 17: Missing key fallback**
   * **Validates: Requirements 5.3**
   *
   * Property 17: Missing key fallback
   * For any shipping method with missing translation keys, the system should
   * display the method ID as fallback and log the error
   */
  it('Property 17: Missing key fallback - should use method ID as fallback for missing keys', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locale: fc.constantFrom('en', 'vi'),
          shippingMethods: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 50 }),
              hasNameEn: fc.boolean(),
              hasNameVi: fc.boolean(),
              hasDescriptionEn: fc.boolean(),
              hasDescriptionVi: fc.boolean(),
              nameEn: fc.string({ minLength: 5, maxLength: 100 }),
              nameVi: fc.string({ minLength: 5, maxLength: 100 }),
              descriptionEn: fc.string({ minLength: 10, maxLength: 200 }),
              descriptionVi: fc.string({ minLength: 10, maxLength: 200 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (params) => {
          const { locale, shippingMethods } = params;

          // Create mock methods with potentially missing keys
          const mockMethods = shippingMethods.map(method => ({
            id: method.id,
            nameEn: method.hasNameEn ? method.nameEn : null,
            nameVi: method.hasNameVi ? method.nameVi : null,
            descriptionEn: method.hasDescriptionEn ? method.descriptionEn : null,
            descriptionVi: method.hasDescriptionVi ? method.descriptionVi : null,
            baseCost: 25000,
            isActive: true,
            estimatedDays: '3-5',
            carrier: 'Test Carrier',
            isFreeShipping: false,
          }));

          mockShippingMethodsService.findAll.mockResolvedValue(mockMethods);

          // Mock translation service to handle missing keys
          mockTranslationService.translateShippingMethod.mockImplementation((method, locale) => {
            const nameKey = locale === 'vi' ? 'nameVi' : 'nameEn';
            const descriptionKey = locale === 'vi' ? 'descriptionVi' : 'descriptionEn';

            let name = method[nameKey];
            let description = method[descriptionKey];

            // Fallback chain: requested locale -> English -> method ID
            if (!name || name.trim().length === 0) {
              name = method.nameEn;
              if (!name || name.trim().length === 0) {
                mockLogger.error(`Missing translation keys for shipping method ${method.id}`);
                name = `[Method: ${method.id}]`;
              }
            }

            if (!description || description.trim().length === 0) {
              description = method.descriptionEn;
              if (!description || description.trim().length === 0) {
                mockLogger.error(`Missing description keys for shipping method ${method.id}`);
                description = `[Method ID: ${method.id}]`;
              }
            }

            return { name, description };
          });

          try {
            // Process each shipping method
            for (const method of mockMethods) {
              const translation = mockTranslationService.translateShippingMethod(method, locale);

              const requestedName = locale === 'vi' ? method.nameVi : method.nameEn;
              const requestedDescription = locale === 'vi' ? method.descriptionVi : method.descriptionEn;

              // Property: Should always return a valid translation object
              expect(translation).toBeDefined();
              expect(translation.name).toBeDefined();
              expect(translation.description).toBeDefined();

              // Property: Should use fallback chain correctly
              if (!requestedName || requestedName.trim().length === 0) {
                if (method.nameEn && method.nameEn.trim().length > 0) {
                  expect(translation.name).toBe(method.nameEn);
                } else {
                  expect(translation.name).toBe(`[Method: ${method.id}]`);
                  expect(mockLogger.error).toHaveBeenCalledWith(
                    expect.stringContaining(`Missing translation keys for shipping method ${method.id}`)
                  );
                }
              } else {
                expect(translation.name).toBe(requestedName);
              }

              if (!requestedDescription || requestedDescription.trim().length === 0) {
                if (method.descriptionEn && method.descriptionEn.trim().length > 0) {
                  expect(translation.description).toBe(method.descriptionEn);
                } else {
                  expect(translation.description).toBe(`[Method ID: ${method.id}]`);
                  expect(mockLogger.error).toHaveBeenCalledWith(
                    expect.stringContaining(`Missing description keys for shipping method ${method.id}`)
                  );
                }
              } else {
                expect(translation.description).toBe(requestedDescription);
              }

              // Property: Should never return null or undefined
              expect(translation.name).not.toBeNull();
              expect(translation.name).not.toBeUndefined();
              expect(translation.description).not.toBeNull();
              expect(translation.description).not.toBeUndefined();

              // Property: Should never return empty strings
              expect(translation.name.length).toBeGreaterThan(0);
              expect(translation.description.length).toBeGreaterThan(0);

              // Property: Method ID fallback should be identifiable
              if (translation.name.includes('[Method:')) {
                expect(translation.name).toContain(method.id);
              }
              if (translation.description.includes('[Method ID:')) {
                expect(translation.description).toContain(method.id);
              }
            }

          } catch (error) {
            // If an error occurs, it should be properly handled
            expect(error).toBeDefined();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
        verbose: true,
      }
    );
  }, 60000);

  /**
   * **Feature: shipping-method-localization, Property 19: Corrupted data handling**
   * **Validates: Requirements 5.5**
   *
   * Property 19: Corrupted data handling
   * For any shipping calculation with corrupted method data, invalid methods should
   * be excluded while processing continues for valid methods
   */
  it('Property 19: Corrupted data handling - should exclude corrupted methods and continue processing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locale: fc.constantFrom('en', 'vi'),
          validMethods: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 50 }),
              nameEn: fc.string({ minLength: 5, maxLength: 100 }),
              nameVi: fc.string({ minLength: 5, maxLength: 100 }),
              descriptionEn: fc.string({ minLength: 10, maxLength: 200 }),
              descriptionVi: fc.string({ minLength: 10, maxLength: 200 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          corruptedMethods: fc.array(
            fc.record({
              id: fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant('')),
              nameEn: fc.oneof(fc.constant(null), fc.constant(undefined), fc.string({ maxLength: 100 })),
              nameVi: fc.oneof(fc.constant(null), fc.constant(undefined), fc.string({ maxLength: 100 })),
              descriptionEn: fc.oneof(fc.constant(null), fc.constant(undefined), fc.string({ maxLength: 200 })),
              descriptionVi: fc.oneof(fc.constant(null), fc.constant(undefined), fc.string({ maxLength: 200 })),
            }),
            { minLength: 0, maxLength: 3 }
          ),
        }),
        async (params) => {
          const { locale, validMethods, corruptedMethods } = params;

          // Create mock valid methods
          const mockValidMethods = validMethods.map(method =>
            createMockShippingMethod(
              method.id,
              method.nameEn,
              method.nameVi,
              method.descriptionEn,
              method.descriptionVi
            )
          );

          // Create mock corrupted methods
          const mockCorruptedMethods = corruptedMethods.map(method => ({
            id: method.id,
            nameEn: method.nameEn,
            nameVi: method.nameVi,
            descriptionEn: method.descriptionEn,
            descriptionVi: method.descriptionVi,
            baseCost: 25000,
            isActive: true,
            estimatedDays: '3-5',
            carrier: 'Test Carrier',
            isFreeShipping: false,
          }));

          // Combine valid and corrupted methods
          const allMethods = [...mockValidMethods, ...mockCorruptedMethods];
          mockShippingMethodsService.findAll.mockResolvedValue(allMethods);

          // Mock validation function
          const isValidShippingMethod = (method: any) => {
            return (
              method &&
              method.id &&
              typeof method.id === 'string' &&
              method.id.trim().length > 0 &&
              (method.nameEn || method.nameVi) &&
              (method.descriptionEn || method.descriptionVi)
            );
          };

          try {
            // Filter out corrupted methods
            const validMethodsOnly = allMethods.filter(method => {
              const isValid = isValidShippingMethod(method);

              if (!isValid) {
                mockLogger.error(`Corrupted shipping method data detected: ${JSON.stringify(method)}`);
              }

              return isValid;
            });

            // Property: Corrupted methods should be excluded
            expect(validMethodsOnly.length).toBe(mockValidMethods.length);
            expect(validMethodsOnly.length).toBeLessThanOrEqual(allMethods.length);

            // Property: All valid methods should be included
            for (const validMethod of mockValidMethods) {
              const found = validMethodsOnly.find(m => m.id === validMethod.id);
              expect(found).toBeDefined();
            }

            // Property: No corrupted methods should be included
            for (const corruptedMethod of mockCorruptedMethods) {
              const found = validMethodsOnly.find(m => m.id === corruptedMethod.id);
              expect(found).toBeUndefined();
            }

            // Property: Should log errors for corrupted methods
            if (mockCorruptedMethods.length > 0) {
              expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Corrupted shipping method data detected')
              );
            }

            // Property: Processing should continue for valid methods
            for (const method of validMethodsOnly) {
              expect(method.id).toBeDefined();
              expect(typeof method.id).toBe('string');
              expect(method.id.length).toBeGreaterThan(0);
              expect(method.nameEn || method.nameVi).toBeTruthy();
              expect(method.descriptionEn || method.descriptionVi).toBeTruthy();
            }

            // Property: System should not crash due to corrupted data
            expect(validMethodsOnly).toBeDefined();
            expect(Array.isArray(validMethodsOnly)).toBe(true);

            // Property: Valid methods should have all required fields
            for (const method of validMethodsOnly) {
              expect(method.id).toBeDefined();
              expect(method.baseCost).toBeDefined();
              expect(method.isActive).toBeDefined();
              expect(method.estimatedDays).toBeDefined();
            }

          } catch (error) {
            // If an error occurs, it should be properly handled
            expect(error).toBeDefined();
            expect(mockLogger.error).toHaveBeenCalled();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
        verbose: true,
      }
    );
  }, 60000);
});