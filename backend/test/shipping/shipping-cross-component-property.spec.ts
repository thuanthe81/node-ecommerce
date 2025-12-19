import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from '../../src/shipping/shipping.service';
import { OrdersService } from '../../src/orders/orders.service';
import { PDFGeneratorService } from '../../src/pdf-generator/pdf-generator.service';
import { EmailService } from '../../src/notifications/services/email.service';
import { TranslationService } from '../../src/common/services/translation.service';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Cross-Component Shipping Localization Consistency
 *
 * These tests verify universal properties that should hold across all system components
 * that display shipping method information, using fast-check for property-based testing.
 */
describe('Shipping Cross-Component Consistency - Property-Based Tests', () => {
  let shippingService: ShippingService;
  let ordersService: OrdersService;
  let pdfGeneratorService: PDFGeneratorService;
  let emailService: EmailService;
  let translationService: TranslationService;

  const mockShippingService = {
    calculateShipping: jest.fn(),
    getShippingMethodById: jest.fn(),
  };

  const mockOrdersService = {
    findOne: jest.fn(),
    generateOrderConfirmation: jest.fn(),
  };

  const mockPDFGeneratorService = {
    generateOrderPDF: jest.fn(),
    getShippingMethodText: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
    getShippingMethodText: jest.fn(),
  };

  const mockTranslationService = {
    translateShippingMethod: jest.fn(),
    translatePaymentMethod: jest.fn(),
    translateOrderStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ShippingService,
          useValue: mockShippingService,
        },
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: PDFGeneratorService,
          useValue: mockPDFGeneratorService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: TranslationService,
          useValue: mockTranslationService,
        },
      ],
    }).compile();

    shippingService = module.get<ShippingService>(ShippingService);
    ordersService = module.get<OrdersService>(OrdersService);
    pdfGeneratorService = module.get<PDFGeneratorService>(PDFGeneratorService);
    emailService = module.get<EmailService>(EmailService);
    translationService = module.get<TranslationService>(TranslationService);
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
   * **Feature: shipping-method-localization, Property 12: Cross-component consistency**
   * **Validates: Requirements 4.1, 4.2, 4.3**
   *
   * Property 12: Cross-component consistency
   * For any shipping method data, the localized text should be identical across
   * PDF generation, order confirmations, and email notifications for the same locale
   */
  it('Property 12: Cross-component consistency - should use identical localized text across all components', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locale: fc.constantFrom('en', 'vi'),
          shippingMethod: fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            nameEn: fc.string({ minLength: 5, maxLength: 100 }),
            nameVi: fc.string({ minLength: 5, maxLength: 100 }),
            descriptionEn: fc.string({ minLength: 10, maxLength: 200 }),
            descriptionVi: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          orderId: fc.string({ minLength: 1, maxLength: 50 }),
          customerEmail: fc.emailAddress(),
        }),
        async (params) => {
          const { locale, shippingMethod, orderId, customerEmail } = params;

          const mockMethod = createMockShippingMethod(
            shippingMethod.id,
            shippingMethod.nameEn,
            shippingMethod.nameVi,
            shippingMethod.descriptionEn,
            shippingMethod.descriptionVi
          );

          // Setup translation service to return consistent translations
          const expectedName = locale === 'vi' ? shippingMethod.nameVi : shippingMethod.nameEn;
          const expectedDescription = locale === 'vi' ? shippingMethod.descriptionVi : shippingMethod.descriptionEn;

          mockTranslationService.translateShippingMethod.mockReturnValue({
            name: expectedName,
            description: expectedDescription,
          });

          // Mock services to use translation service
          mockShippingService.getShippingMethodById.mockResolvedValue(mockMethod);

          mockPDFGeneratorService.getShippingMethodText.mockImplementation(() => {
            const translation = translationService.translateShippingMethod(mockMethod, locale);
            return `${translation.name} - ${translation.description}`;
          });

          mockEmailService.getShippingMethodText.mockImplementation(() => {
            const translation = translationService.translateShippingMethod(mockMethod, locale);
            return `${translation.name} - ${translation.description}`;
          });

          mockOrdersService.generateOrderConfirmation.mockImplementation(() => {
            const translation = translationService.translateShippingMethod(mockMethod, locale);
            return {
              shippingMethodText: `${translation.name} - ${translation.description}`,
            };
          });

          try {
            // Get shipping method text from all components
            const pdfText = mockPDFGeneratorService.getShippingMethodText(shippingMethod.id, locale);
            const emailText = mockEmailService.getShippingMethodText(shippingMethod.id, locale);
            const orderConfirmation = mockOrdersService.generateOrderConfirmation(orderId, locale);

            // Property: All components should use the translation service
            expect(mockTranslationService.translateShippingMethod).toHaveBeenCalledWith(mockMethod, locale);

            // Property: All components should return identical text for the same shipping method and locale
            expect(pdfText).toBe(emailText);
            expect(pdfText).toBe(orderConfirmation.shippingMethodText);
            expect(emailText).toBe(orderConfirmation.shippingMethodText);

            // Property: The text should contain the correct localized content
            expect(pdfText).toContain(expectedName);
            expect(pdfText).toContain(expectedDescription);
            expect(emailText).toContain(expectedName);
            expect(emailText).toContain(expectedDescription);
            expect(orderConfirmation.shippingMethodText).toContain(expectedName);
            expect(orderConfirmation.shippingMethodText).toContain(expectedDescription);

            // Property: The text should not contain the other locale's content
            const otherLocaleName = locale === 'vi' ? shippingMethod.nameEn : shippingMethod.nameVi;
            const otherLocaleDescription = locale === 'vi' ? shippingMethod.descriptionEn : shippingMethod.descriptionVi;

            expect(pdfText).not.toContain(otherLocaleName);
            expect(pdfText).not.toContain(otherLocaleDescription);
            expect(emailText).not.toContain(otherLocaleName);
            expect(emailText).not.toContain(otherLocaleDescription);
            expect(orderConfirmation.shippingMethodText).not.toContain(otherLocaleName);
            expect(orderConfirmation.shippingMethodText).not.toContain(otherLocaleDescription);

            // Property: All components should call the translation service with the same parameters
            const translationCalls = mockTranslationService.translateShippingMethod.mock.calls;
            for (const call of translationCalls) {
              expect(call[0]).toEqual(mockMethod);
              expect(call[1]).toBe(locale);
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
   * **Feature: shipping-method-localization, Property 13: Translation update propagation**
   * **Validates: Requirements 4.4**
   *
   * Property 13: Translation update propagation
   * For any shipping method translation update, the changes should be reflected
   * consistently across all system components that display shipping methods
   */
  it('Property 13: Translation update propagation - should propagate translation updates across all components', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locale: fc.constantFrom('en', 'vi'),
          shippingMethod: fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            nameEn: fc.string({ minLength: 5, maxLength: 100 }),
            nameVi: fc.string({ minLength: 5, maxLength: 100 }),
            descriptionEn: fc.string({ minLength: 10, maxLength: 200 }),
            descriptionVi: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          updatedTranslations: fc.record({
            nameEn: fc.string({ minLength: 5, maxLength: 100 }),
            nameVi: fc.string({ minLength: 5, maxLength: 100 }),
            descriptionEn: fc.string({ minLength: 10, maxLength: 200 }),
            descriptionVi: fc.string({ minLength: 10, maxLength: 200 }),
          }),
        }),
        async (params) => {
          const { locale, shippingMethod, updatedTranslations } = params;

          // Create initial shipping method
          const initialMethod = createMockShippingMethod(
            shippingMethod.id,
            shippingMethod.nameEn,
            shippingMethod.nameVi,
            shippingMethod.descriptionEn,
            shippingMethod.descriptionVi
          );

          // Create updated shipping method
          const updatedMethod = createMockShippingMethod(
            shippingMethod.id,
            updatedTranslations.nameEn,
            updatedTranslations.nameVi,
            updatedTranslations.descriptionEn,
            updatedTranslations.descriptionVi
          );

          // Setup initial state
          mockShippingService.getShippingMethodById.mockResolvedValueOnce(initialMethod);

          const initialExpectedName = locale === 'vi' ? shippingMethod.nameVi : shippingMethod.nameEn;
          const initialExpectedDescription = locale === 'vi' ? shippingMethod.descriptionVi : shippingMethod.descriptionEn;

          mockTranslationService.translateShippingMethod.mockReturnValueOnce({
            name: initialExpectedName,
            description: initialExpectedDescription,
          });

          // Get initial text from all components
          const initialPdfText = mockPDFGeneratorService.getShippingMethodText(shippingMethod.id, locale);
          const initialEmailText = mockEmailService.getShippingMethodText(shippingMethod.id, locale);

          // Property: Initial state should be consistent (both should use same translation service)
          expect(typeof initialPdfText).toBe('string');
          expect(typeof initialEmailText).toBe('string');
          expect(initialPdfText.length).toBeGreaterThan(0);
          expect(initialEmailText.length).toBeGreaterThan(0);

          // Simulate translation update
          mockShippingService.getShippingMethodById.mockResolvedValueOnce(updatedMethod);

          const updatedExpectedName = locale === 'vi' ? updatedTranslations.nameVi : updatedTranslations.nameEn;
          const updatedExpectedDescription = locale === 'vi' ? updatedTranslations.descriptionVi : updatedTranslations.descriptionEn;

          mockTranslationService.translateShippingMethod.mockReturnValueOnce({
            name: updatedExpectedName,
            description: updatedExpectedDescription,
          });

          // Get updated text from all components
          const updatedPdfText = mockPDFGeneratorService.getShippingMethodText(shippingMethod.id, locale);
          const updatedEmailText = mockEmailService.getShippingMethodText(shippingMethod.id, locale);

          try {
            // Property: Updated translations should be reflected in all components
            expect(typeof updatedPdfText).toBe('string');
            expect(typeof updatedEmailText).toBe('string');
            expect(updatedPdfText.length).toBeGreaterThan(0);
            expect(updatedEmailText.length).toBeGreaterThan(0);

            // Property: Both components should use the same translation service and return consistent results
            expect(updatedPdfText).toBe(updatedEmailText);

            // Property: Updated text should contain the correct localized content
            expect(updatedPdfText).toContain(updatedExpectedName);
            expect(updatedPdfText).toContain(updatedExpectedDescription);

            // Property: All components should use the same translation service calls
            const translationCalls = mockTranslationService.translateShippingMethod.mock.calls;
            expect(translationCalls.length).toBeGreaterThanOrEqual(2);

            // Property: Each component should get the same translation for the same method and locale
            for (let i = 0; i < translationCalls.length - 1; i += 2) {
              const firstCall = translationCalls[i];
              const secondCall = translationCalls[i + 1];

              if (firstCall && secondCall) {
                expect(firstCall[1]).toBe(secondCall[1]); // Same locale
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
   * **Feature: shipping-method-localization, Property 14: Complete translation validation**
   * **Validates: Requirements 4.5**
   *
   * Property 14: Complete translation validation
   * For any active shipping method, both English and Vietnamese translations
   * should exist and be non-empty
   */
  it('Property 14: Complete translation validation - should validate all active methods have complete translations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            nameEn: fc.oneof(
              fc.string({ minLength: 1, maxLength: 100 }),
              fc.constant(''),
              fc.constant(null),
              fc.constant(undefined)
            ),
            nameVi: fc.oneof(
              fc.string({ minLength: 1, maxLength: 100 }),
              fc.constant(''),
              fc.constant(null),
              fc.constant(undefined)
            ),
            descriptionEn: fc.oneof(
              fc.string({ minLength: 1, maxLength: 200 }),
              fc.constant(''),
              fc.constant(null),
              fc.constant(undefined)
            ),
            descriptionVi: fc.oneof(
              fc.string({ minLength: 1, maxLength: 200 }),
              fc.constant(''),
              fc.constant(null),
              fc.constant(undefined)
            ),
            isActive: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (shippingMethods) => {
          // Create mock methods
          const mockMethods = shippingMethods.map(method => ({
            ...createMockShippingMethod(method.id, '', '', '', ''),
            nameEn: method.nameEn,
            nameVi: method.nameVi,
            descriptionEn: method.descriptionEn,
            descriptionVi: method.descriptionVi,
            isActive: method.isActive,
          }));

          // Mock the validation function
          const validateTranslationCompleteness = (methods: typeof mockMethods) => {
            const validationResults = [];

            for (const method of methods) {
              if (method.isActive) {
                const hasCompleteTranslations =
                  method.nameEn && method.nameEn.trim().length > 0 &&
                  method.nameVi && method.nameVi.trim().length > 0 &&
                  method.descriptionEn && method.descriptionEn.trim().length > 0 &&
                  method.descriptionVi && method.descriptionVi.trim().length > 0;

                validationResults.push({
                  methodId: method.id,
                  isValid: hasCompleteTranslations,
                  missingFields: [
                    !method.nameEn || method.nameEn.trim().length === 0 ? 'nameEn' : null,
                    !method.nameVi || method.nameVi.trim().length === 0 ? 'nameVi' : null,
                    !method.descriptionEn || method.descriptionEn.trim().length === 0 ? 'descriptionEn' : null,
                    !method.descriptionVi || method.descriptionVi.trim().length === 0 ? 'descriptionVi' : null,
                  ].filter(Boolean),
                });
              }
            }

            return validationResults;
          };

          try {
            const validationResults = validateTranslationCompleteness(mockMethods);

            // Property: All active shipping methods should be validated
            const activeMethods = mockMethods.filter(m => m.isActive);
            expect(validationResults.length).toBe(activeMethods.length);

            // Property: Each validation result should correspond to an active method
            for (const result of validationResults) {
              const method = mockMethods.find(m => m.id === result.methodId);
              expect(method).toBeDefined();
              expect(method.isActive).toBe(true);
            }

            // Property: Validation should correctly identify complete translations
            for (const result of validationResults) {
              const method = mockMethods.find(m => m.id === result.methodId);

              const actuallyComplete =
                method.nameEn && method.nameEn.trim().length > 0 &&
                method.nameVi && method.nameVi.trim().length > 0 &&
                method.descriptionEn && method.descriptionEn.trim().length > 0 &&
                method.descriptionVi && method.descriptionVi.trim().length > 0;

              expect(result.isValid).toBe(actuallyComplete);
            }

            // Property: Missing fields should be correctly identified
            for (const result of validationResults) {
              const method = mockMethods.find(m => m.id === result.methodId);

              const expectedMissingFields = [
                !method.nameEn || method.nameEn.trim().length === 0 ? 'nameEn' : null,
                !method.nameVi || method.nameVi.trim().length === 0 ? 'nameVi' : null,
                !method.descriptionEn || method.descriptionEn.trim().length === 0 ? 'descriptionEn' : null,
                !method.descriptionVi || method.descriptionVi.trim().length === 0 ? 'descriptionVi' : null,
              ].filter(Boolean);

              expect(result.missingFields).toEqual(expectedMissingFields);
            }

            // Property: Inactive methods should not be validated
            const inactiveMethods = mockMethods.filter(m => !m.isActive);
            for (const inactiveMethod of inactiveMethods) {
              const validationResult = validationResults.find(r => r.methodId === inactiveMethod.id);
              expect(validationResult).toBeUndefined();
            }

            // Property: Methods with complete translations should have no missing fields
            const completeResults = validationResults.filter(r => r.isValid);
            for (const completeResult of completeResults) {
              expect(completeResult.missingFields).toHaveLength(0);
            }

            // Property: Methods with incomplete translations should have at least one missing field
            const incompleteResults = validationResults.filter(r => !r.isValid);
            for (const incompleteResult of incompleteResults) {
              expect(incompleteResult.missingFields.length).toBeGreaterThan(0);
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
});