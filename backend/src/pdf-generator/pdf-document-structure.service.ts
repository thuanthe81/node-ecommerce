import { Injectable, Logger } from '@nestjs/common';
import { OrderPDFData, PDFStyling } from './types/pdf.types';
import { CONSTANTS } from '@alacraft/shared';
import { PDFLocalizationService } from './services/pdf-localization.service';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class PDFDocumentStructureService {
  private readonly logger = new Logger(PDFDocumentStructureService.name);

  constructor(
    private readonly localizationService: PDFLocalizationService,
    private readonly shippingService: ShippingService,
  ) {}

  /**
   * Generate complete document structure with proper layout
   * @param orderData - Order data for document generation
   * @param locale - Language locale
   * @param styling - PDF styling configuration
   * @returns Complete HTML document with proper structure
   */
  async generateDocumentStructure(
    orderData: OrderPDFData,
    locale: 'en' | 'vi',
    styling: PDFStyling
  ): Promise<string> {
    const isVietnamese = locale === 'vi';
    const mainContent = await this.generateMainContent(orderData, locale);

    return `
      <!DOCTYPE html>
      <html lang="${locale}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${isVietnamese ? `Đơn hàng ${orderData.orderNumber}` : `Order ${orderData.orderNumber}`}</title>
          <style>
            ${this.generateResponsiveCSS(styling)}
          </style>
        </head>
        <body>
          <div class="document-container">
            ${this.generateHeader(orderData, locale)}
            ${mainContent}
            ${this.generateFooter(orderData, locale)}
          </div>

          <!-- Page break helpers for multi-page documents -->
          <div class="page-break-helper"></div>
        </body>
      </html>
    `;
  }

  /**
   * Generate document header with logo and order information
   */
  private generateHeader(orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    const companyName = orderData.businessInfo?.companyName || CONSTANTS.BUSINESS.COMPANY.NAME[locale.toUpperCase() as 'EN' | 'VI'];

    return `
      <header class="document-header">
        <div class="header-content">
          <div class="company-section">
            ${orderData.businessInfo.logoUrl ?
              `<img src="${orderData.businessInfo.logoUrl}" alt="${companyName}" class="company-logo">` :
              `<h1 class="company-name">${companyName}</h1>`
            }
            <div class="company-details">
              <p class="company-address">${orderData.businessInfo.address.addressLine1}</p>
              ${orderData.businessInfo.address.addressLine2 ?
                `<p class="company-address">${orderData.businessInfo.address.addressLine2}</p>` : ''
              }
              <p class="company-address">${orderData.businessInfo.address.city}, ${orderData.businessInfo.address.state} ${orderData.businessInfo.address.postalCode}</p>
              <p class="company-contact">Email: ${orderData.businessInfo.contactEmail}</p>
              ${orderData.businessInfo.contactPhone ?
                `<p class="company-contact">${isVietnamese ? 'ĐT' : 'Phone'}: ${orderData.businessInfo.contactPhone}</p>` : ''
              }
            </div>
          </div>

          <div class="document-info">
            <h1 class="document-title">${isVietnamese ? 'XÁC NHẬN ĐƠN HÀNG' : 'ORDER CONFIRMATION'}</h1>
            <div class="order-details">
              <p class="order-number">
                <span class="label">${isVietnamese ? 'Số đơn hàng' : 'Order Number'}:</span>
                <span class="value">${orderData.orderNumber}</span>
              </p>
              <p class="order-date">
                <span class="label">${isVietnamese ? 'Ngày đặt hàng' : 'Order Date'}:</span>
                <span class="value">${orderData.orderDate}</span>
              </p>
              <p class="generation-date">
                <span class="label">${isVietnamese ? 'Ngày in' : 'Generated'}:</span>
                <span class="value">${new Date().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}</span>
              </p>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  /**
   * Generate main content with responsive layout
   */
  private async generateMainContent(orderData: OrderPDFData, locale: 'en' | 'vi'): Promise<string> {
    const shippingSection = await this.generateShippingSection(orderData, locale);

    return `
      <main class="document-main">
        ${this.generateCustomerSection(orderData, locale)}
        ${this.generateAddressSection(orderData, locale)}
        ${this.generateOrderItemsSection(orderData, locale)}
        ${this.generateOrderSummarySection(orderData, locale)}
        ${this.generatePaymentSection(orderData, locale)}
        ${shippingSection}
      </main>
    `;
  }

  /**
   * Generate customer information section
   */
  private generateCustomerSection(orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    return `
      <section class="customer-section">
        <h2 class="section-title">${isVietnamese ? 'Thông tin khách hàng' : 'Customer Information'}</h2>
        <div class="customer-info">
          <div class="info-row">
            <span class="info-label">${isVietnamese ? 'Tên khách hàng' : 'Customer Name'}:</span>
            <span class="info-value">${orderData.customerInfo.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${orderData.customerInfo.email}</span>
          </div>
          ${orderData.customerInfo.phone ? `
            <div class="info-row">
              <span class="info-label">${isVietnamese ? 'Số điện thoại' : 'Phone Number'}:</span>
              <span class="info-value">${orderData.customerInfo.phone}</span>
            </div>
          ` : ''}
        </div>
      </section>
    `;
  }

  /**
   * Generate address section with responsive layout
   */
  private generateAddressSection(orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    return `
      <section class="address-section">
        <div class="address-container">
          <div class="address-column">
            <h3 class="address-title">${isVietnamese ? 'Địa chỉ giao hàng' : 'Shipping Address'}</h3>
            <div class="address-content">
              <p class="address-name">${orderData.shippingAddress.fullName}</p>
              <p class="address-line">${orderData.shippingAddress.addressLine1}</p>
              ${orderData.shippingAddress.addressLine2 ?
                `<p class="address-line">${orderData.shippingAddress.addressLine2}</p>` : ''
              }
              <p class="address-line">${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}</p>
              <p class="address-line">${orderData.shippingAddress.country}</p>
              ${orderData.shippingAddress.phone ?
                `<p class="address-phone">${isVietnamese ? 'ĐT' : 'Phone'}: ${orderData.shippingAddress.phone}</p>` : ''
              }
            </div>
          </div>

          <div class="address-column">
            <h3 class="address-title">${isVietnamese ? 'Địa chỉ thanh toán' : 'Billing Address'}</h3>
            <div class="address-content">
              <p class="address-name">${orderData.billingAddress.fullName}</p>
              <p class="address-line">${orderData.billingAddress.addressLine1}</p>
              ${orderData.billingAddress.addressLine2 ?
                `<p class="address-line">${orderData.billingAddress.addressLine2}</p>` : ''
              }
              <p class="address-line">${orderData.billingAddress.city}, ${orderData.billingAddress.state} ${orderData.billingAddress.postalCode}</p>
              <p class="address-line">${orderData.billingAddress.country}</p>
              ${orderData.billingAddress.phone ?
                `<p class="address-phone">${isVietnamese ? 'ĐT' : 'Phone'}: ${orderData.billingAddress.phone}</p>` : ''
              }
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Generate order items section with responsive table
   */
  private generateOrderItemsSection(orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    return `
      <section class="items-section">
        <h2 class="section-title">${isVietnamese ? 'Chi tiết đơn hàng' : 'Order Items'}</h2>
        <div class="items-summary">
          <span class="items-count">
            ${isVietnamese
              ? `Tổng cộng ${orderData.items.length} sản phẩm`
              : `${orderData.items.length} item${orderData.items.length !== 1 ? 's' : ''} total`
            }
          </span>
        </div>
        <div class="table-container">
          <table class="items-table">
            <thead>
              <tr>
                <th class="item-col">${isVietnamese ? 'Sản phẩm' : 'Product'}</th>
                <th class="sku-col">SKU</th>
                <th class="qty-col">${isVietnamese ? 'SL' : 'Qty'}</th>
                <th class="price-col">${isVietnamese ? 'Đơn giá' : 'Unit Price'}</th>
                <th class="total-col">${isVietnamese ? 'Thành tiền' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map((item, index) => `
                <tr class="item-row ${index % 2 === 0 ? 'even' : 'odd'}">
                  <td class="item-info">
                    <div class="product-details">
                      ${item.imageUrl && typeof item.imageUrl === 'string' ?
                        `<img src="${item.imageUrl}" alt="${item.name}" class="product-image" onerror="this.style.display='none'">` :
                        ''
                      }
                      <div class="product-text">
                        <span class="product-name">${item.name}</span>
                        ${item.description ? `<span class="product-description">${item.description}</span>` : ''}
                        ${item.category ? `<span class="product-category">${isVietnamese ? 'Danh mục' : 'Category'}: ${item.category}</span>` : ''}
                      </div>
                    </div>
                  </td>
                  <td class="sku-cell">${item.sku || '-'}</td>
                  <td class="qty-cell">${item.quantity}</td>
                  <td class="price-cell">${this.formatCurrency(item.unitPrice, locale)}</td>
                  <td class="total-cell">${this.formatCurrency(item.totalPrice, locale)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  /**
   * Generate individual order item row with enhanced product information
   */
  private generateOrderItemRow(item: any, index: number, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    const isZeroPrice = item.unitPrice === 0;

    return `
      <tr class="item-row ${index % 2 === 0 ? 'even' : 'odd'} ${isZeroPrice ? 'zero-price' : ''}">
        <td class="item-info">
          <div class="product-details">
            ${this.generateProductImage(item)}
            <div class="product-text">
              <span class="product-name">${item.name}</span>
              ${item.description ? `<span class="product-description">${item.description}</span>` : ''}
              ${item.category ? `<span class="product-category">${isVietnamese ? 'Danh mục' : 'Category'}: ${item.category}</span>` : ''}
              ${isZeroPrice ? `<span class="zero-price-badge">${isVietnamese ? 'Miễn phí' : 'Free'}</span>` : ''}
            </div>
          </div>
        </td>
        <td class="sku-cell">
          ${item.sku ? `<code class="sku-code">${item.sku}</code>` : '<span class="no-sku">-</span>'}
        </td>
        <td class="qty-cell">
          <span class="quantity-value">${item.quantity}</span>
          ${item.quantity > 1 ? `<span class="quantity-unit">${isVietnamese ? 'cái' : 'pcs'}</span>` : ''}
        </td>
        <td class="price-cell">
          ${isZeroPrice
            ? `<span class="free-price">${isVietnamese ? 'Miễn phí' : 'Free'}</span>`
            : `<span class="unit-price">${this.formatCurrency(item.unitPrice, locale)}</span>`
          }
        </td>
        <td class="total-cell">
          <strong class="item-total ${isZeroPrice ? 'zero-total' : ''}">
            ${this.formatCurrency(item.totalPrice, locale)}
          </strong>
        </td>
      </tr>
    `;
  }

  /**
   * Generate product image with enhanced fallback handling
   */
  private generateProductImage(item: any): string {
    if (!item.imageUrl || typeof item.imageUrl !== 'string') {
      return `
        <div class="product-image-placeholder">
          <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
      `;
    }

    return `
      <div class="product-image-container">
        <img
          src="${item.imageUrl}"
          alt="${item.name}"
          class="product-image"
          onerror="this.parentElement.innerHTML='<div class=\\"product-image-placeholder\\"><svg class=\\"placeholder-icon\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\"><rect x=\\"3\\" y=\\"3\\" width=\\"18\\" height=\\"18\\" rx=\\"2\\" ry=\\"2\\"/><circle cx=\\"8.5\\" cy=\\"8.5\\" r=\\"1.5\\"/><polyline points=\\"21,15 16,10 5,21\\"/></svg></div>';"
        >
      </div>
    `;
  }

  /**
   * Format currency with proper locale support
   */
  private formatCurrency(amount: number, locale: 'en' | 'vi'): string {
    // Use Vietnamese number formatting for all locales with consistent "amount ₫" pattern
    // This matches the email template service formatting for cross-service consistency
    const formattedAmount = amount.toLocaleString('vi-VN');
    return `${formattedAmount} ₫`;
  }

  /**
   * Generate order summary section
   */
  private generateOrderSummarySection(orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    return `
      <section class="summary-section">
        <h2 class="section-title">${isVietnamese ? 'Tổng kết đơn hàng' : 'Order Summary'}</h2>
        <div class="summary-container">
          <table class="summary-table">
            <tbody>
              <tr class="summary-row">
                <td class="summary-label">${isVietnamese ? 'Tạm tính' : 'Subtotal'}:</td>
                <td class="summary-value">${this.formatCurrency(orderData.pricing.subtotal, locale)}</td>
              </tr>
              <tr class="summary-row">
                <td class="summary-label">${isVietnamese ? 'Phí vận chuyển' : 'Shipping'}:</td>
                <td class="summary-value">${this.formatCurrency(orderData.pricing.shippingCost, locale)}</td>
              </tr>
              ${orderData.pricing.taxAmount ? `
                <tr class="summary-row">
                  <td class="summary-label">${isVietnamese ? 'Thuế' : 'Tax'}:</td>
                  <td class="summary-value">${this.formatCurrency(orderData.pricing.taxAmount, locale)}</td>
                </tr>
              ` : ''}
              ${orderData.pricing.discountAmount ? `
                <tr class="summary-row discount">
                  <td class="summary-label">${isVietnamese ? 'Giảm giá' : 'Discount'}:</td>
                  <td class="summary-value">-${this.formatCurrency(orderData.pricing.discountAmount, locale)}</td>
                </tr>
              ` : ''}
              <tr class="summary-row total">
                <td class="summary-label">${isVietnamese ? 'Tổng cộng' : 'Total'}:</td>
                <td class="summary-value">${this.formatCurrency(orderData.pricing.total, locale)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  /**
   * Generate payment information section with enhanced formatting for different payment types
   */
  private generatePaymentSection(orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    return `
      <section class="payment-section">
        <h2 class="section-title">${isVietnamese ? 'Thông tin thanh toán' : 'Payment Information'}</h2>
        <div class="payment-content">
          <div class="payment-details">
            <div class="payment-row">
              <span class="payment-label">${isVietnamese ? 'Phương thức thanh toán' : 'Payment Method'}:</span>
              <span class="payment-value payment-method-${orderData.paymentMethod.type}">${this.formatPaymentMethodDisplay(orderData.paymentMethod, locale)}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">${isVietnamese ? 'Trạng thái thanh toán' : 'Payment Status'}:</span>
              <span class="payment-value status-${orderData.paymentMethod.status}">
                ${this.getPaymentStatusText(orderData.paymentMethod.status, locale)}
              </span>
            </div>
            ${this.generatePaymentTypeSpecificDetails(orderData.paymentMethod, locale)}
            ${orderData.paymentMethod.instructions ? `
              <div class="payment-instructions">
                <span class="payment-label">${isVietnamese ? 'Hướng dẫn thanh toán' : 'Payment Instructions'}:</span>
                <div class="instructions-content">${orderData.paymentMethod.instructions}</div>
              </div>
            ` : ''}
          </div>

          ${this.generatePaymentQRCodeSection(orderData.paymentMethod, locale)}
        </div>
      </section>
    `;
  }

  /**
   * Format payment method display name with appropriate styling
   */
  private formatPaymentMethodDisplay(paymentMethod: any, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    // Use displayName if available, otherwise format based on type
    if (paymentMethod.displayName) {
      return paymentMethod.displayName;
    }

    // Fallback formatting based on payment type
    const typeDisplayMap: Record<'en' | 'vi', Record<string, string>> = {
      en: {
        bank_transfer: 'Bank Transfer',
        cash_on_delivery: 'Cash on Delivery',
        qr_code: 'QR Code Payment',
      },
      vi: {
        bank_transfer: 'Chuyển khoản ngân hàng',
        cash_on_delivery: 'Thanh toán khi nhận hàng',
        qr_code: 'Thanh toán QR Code',
      },
    };

    return typeDisplayMap[locale][paymentMethod.type] || paymentMethod.type;
  }

  /**
   * Generate payment type specific details section
   */
  private generatePaymentTypeSpecificDetails(paymentMethod: any, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    let detailsHtml = '';

    // Add general details if available
    if (paymentMethod.details) {
      detailsHtml += `
        <div class="payment-row">
          <span class="payment-label">${isVietnamese ? 'Chi tiết' : 'Details'}:</span>
          <span class="payment-value">${paymentMethod.details}</span>
        </div>
      `;
    }

    // Add payment type specific information
    switch (paymentMethod.type) {
      case 'bank_transfer':
        detailsHtml += this.generateBankTransferDetails(paymentMethod, locale);
        break;
      case 'cash_on_delivery':
        detailsHtml += this.generateCashOnDeliveryDetails(paymentMethod, locale);
        break;
      case 'qr_code':
        detailsHtml += this.generateQRCodePaymentDetails(paymentMethod, locale);
        break;
    }

    return detailsHtml;
  }

  /**
   * Generate bank transfer specific details
   */
  private generateBankTransferDetails(paymentMethod: any, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    let html = '';

    if (paymentMethod.accountName) {
      html += `
        <div class="payment-row">
          <span class="payment-label">${isVietnamese ? 'Tên tài khoản' : 'Account Name'}:</span>
          <span class="payment-value account-name">${paymentMethod.accountName}</span>
        </div>
      `;
    }

    if (paymentMethod.accountNumber) {
      html += `
        <div class="payment-row">
          <span class="payment-label">${isVietnamese ? 'Số tài khoản' : 'Account Number'}:</span>
          <span class="payment-value account-number">${paymentMethod.accountNumber}</span>
        </div>
      `;
    }

    if (paymentMethod.bankName) {
      html += `
        <div class="payment-row">
          <span class="payment-label">${isVietnamese ? 'Ngân hàng' : 'Bank Name'}:</span>
          <span class="payment-value bank-name">${paymentMethod.bankName}</span>
        </div>
      `;
    }

    return html;
  }

  /**
   * Generate cash on delivery specific details
   */
  private generateCashOnDeliveryDetails(paymentMethod: any, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    let html = '';

    // Add COD specific instructions if not already in general instructions
    if (!paymentMethod.instructions) {
      html += `
        <div class="payment-row">
          <span class="payment-label">${isVietnamese ? 'Lưu ý' : 'Note'}:</span>
          <span class="payment-value cod-note">
            ${isVietnamese
              ? 'Vui lòng chuẩn bị tiền mặt khi nhận hàng'
              : 'Please prepare cash payment upon delivery'
            }
          </span>
        </div>
      `;
    }

    return html;
  }

  /**
   * Generate QR code payment specific details
   */
  private generateQRCodePaymentDetails(paymentMethod: any, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    let html = '';

    if (paymentMethod.qrCodeProvider) {
      html += `
        <div class="payment-row">
          <span class="payment-label">${isVietnamese ? 'Nhà cung cấp' : 'Provider'}:</span>
          <span class="payment-value qr-provider">${paymentMethod.qrCodeProvider}</span>
        </div>
      `;
    }

    return html;
  }

  /**
   * Generate QR code section with proper formatting and error handling
   */
  private generatePaymentQRCodeSection(paymentMethod: any, locale: 'en' | 'vi'): string {
    if (!paymentMethod.qrCodeUrl) {
      return '';
    }

    const isVietnamese = locale === 'vi';

    return `
      <div class="qr-code-container">
        <h3 class="qr-title">${isVietnamese ? 'Mã QR thanh toán' : 'Payment QR Code'}</h3>
        <div class="qr-code-wrapper">
          <img
            src="${paymentMethod.qrCodeUrl}"
            alt="${isVietnamese ? 'Mã QR thanh toán' : 'Payment QR Code'}"
            class="qr-code"
          >
        </div>
      </div>
    `;
  }

  /**
   * Generate shipping information section with localized shipping method data
   * Fetches shipping method details from shipping service to ensure consistency with checkout
   */
  private async generateShippingSection(orderData: OrderPDFData, locale: 'en' | 'vi'): Promise<string> {
    // Extract shipping method ID from order data
    // The shippingMethod.name might be a method ID or a display name
    // We'll try to fetch localized data from the shipping service
    let localizedName = orderData.shippingMethod.name;
    let localizedDescription = orderData.shippingMethod.description;

    try {
      // Try to get localized shipping method details from shipping service
      // This ensures consistency with the checkout flow
      const shippingMethodDetails = await this.shippingService.getShippingMethodDetails(
        orderData.shippingMethod.name,
        locale
      );

      // Use the localized data from shipping service if available
      if (shippingMethodDetails) {
        localizedName = shippingMethodDetails.name;
        localizedDescription = shippingMethodDetails.description;
      }
    } catch (error) {
      // If fetching fails, fall back to the data from order
      this.logger.warn(`Failed to fetch localized shipping method data: ${error.message}. Using order data as fallback.`);
    }

    return `
      <section class="shipping-section">
        <h2 class="section-title">${this.localizationService.translate('shippingInformation', locale)}</h2>
        <div class="shipping-content">
          <div class="shipping-row">
            <span class="shipping-label">${this.localizationService.translate('shippingMethod', locale)}:</span>
            <span class="shipping-value">${localizedName}</span>
          </div>
          ${localizedDescription ? `
            <div class="shipping-row">
              <span class="shipping-label">${this.localizationService.translate('description', locale)}:</span>
              <span class="shipping-value">${localizedDescription}</span>
            </div>
          ` : ''}
          ${orderData.shippingMethod.estimatedDelivery ? `
            <div class="shipping-row">
              <span class="shipping-label">${this.localizationService.translate('estimatedDelivery', locale)}:</span>
              <span class="shipping-value">${orderData.shippingMethod.estimatedDelivery}</span>
            </div>
          ` : ''}
          ${orderData.shippingMethod.trackingNumber ? `
            <div class="shipping-row">
              <span class="shipping-label">${this.localizationService.translate('trackingNumber', locale)}:</span>
              <span class="shipping-value tracking-number">${orderData.shippingMethod.trackingNumber}</span>
            </div>
          ` : ''}
          ${orderData.shippingMethod.carrier ? `
            <div class="shipping-row">
              <span class="shipping-label">${this.localizationService.translate('carrier', locale)}:</span>
              <span class="shipping-value">${orderData.shippingMethod.carrier}</span>
            </div>
          ` : ''}
        </div>
      </section>
    `;
  }

  /**
   * Generate document footer with minimal content
   */
  private generateFooter(orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';
    const companyName = orderData.businessInfo?.companyName || CONSTANTS.BUSINESS.COMPANY.NAME[locale.toUpperCase() as 'EN' | 'VI'];

    return `
      <footer class="document-footer">
        <div class="footer-content">
          <div class="footer-section thank-you">
            <p class="thank-you-message">
              ${isVietnamese ?
                `Cảm ơn quý khách đã tin tưởng và mua hàng tại ${companyName}!` :
                `Thank you for your purchase from ${companyName}!`
              }
            </p>
            <p class="generation-info">
              ${isVietnamese ? 'Tài liệu được tạo tự động vào' : 'Document generated on'}
              ${new Date().toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}
            </p>
          </div>
        </div>
      </footer>
    `;
  }

  /**
   * Generate responsive CSS with proper margins and page breaks
   */
  private generateResponsiveCSS(styling: PDFStyling): string {
    return `
      /* Reset and base styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: ${styling.fonts.primary};
        font-size: 12px;
        line-height: 1.5;
        color: ${styling.colors.text};
        background-color: ${styling.colors.background};
      }

      /* Document container with proper margins */
      .document-container {
        max-width: 100%;
        margin: 0;
        padding: 0;
      }

      /* Header styles */
      .document-header {
        margin-bottom: ${styling.spacing.large}px;
        padding-bottom: ${styling.spacing.medium}px;
        border-bottom: 2px solid ${styling.colors.primary};
        page-break-inside: avoid;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: ${styling.spacing.medium}px;
      }

      .company-section {
        flex: 1;
      }

      .company-logo {
        max-height: 80px;
        max-width: 250px;
        margin-bottom: ${styling.spacing.small}px;
      }

      .company-name {
        font-size: 24px;
        color: ${styling.colors.primary};
        margin-bottom: ${styling.spacing.small}px;
        font-weight: bold;
      }

      .company-details {
        font-size: 10px;
        color: #666;
      }

      .company-address, .company-contact {
        margin-bottom: 2px;
      }

      .document-info {
        flex: 1;
        text-align: right;
      }

      .document-title {
        font-size: 28px;
        color: ${styling.colors.primary};
        margin-bottom: ${styling.spacing.medium}px;
        font-weight: bold;
      }

      .order-details .label {
        font-weight: bold;
        color: ${styling.colors.primary};
      }

      .order-details .value {
        font-weight: normal;
      }

      .order-number, .order-date, .generation-date {
        margin-bottom: ${styling.spacing.small / 2}px;
        font-size: 14px;
      }

      /* Main content styles */
      .document-main {
        margin-bottom: ${styling.spacing.large}px;
      }

      /* Section styles */
      section {
        margin-bottom: ${styling.spacing.large}px;
        page-break-inside: avoid;
      }

      .section-title {
        font-size: 16px;
        color: ${styling.colors.primary};
        margin-bottom: ${styling.spacing.medium}px;
        font-weight: bold;
        border-bottom: 1px solid ${styling.colors.border};
        padding-bottom: ${styling.spacing.small / 2}px;
      }

      /* Customer section */
      .customer-info {
        background-color: #f9f9f9;
        padding: ${styling.spacing.medium}px;
        border-radius: 4px;
        border: 1px solid ${styling.colors.border};
      }

      .info-row {
        display: flex;
        margin-bottom: ${styling.spacing.small / 2}px;
      }

      .info-label {
        font-weight: bold;
        min-width: 120px;
        color: ${styling.colors.primary};
      }

      .info-value {
        flex: 1;
      }

      /* Address section */
      .address-container {
        display: flex;
        gap: ${styling.spacing.medium}px;
      }

      .address-column {
        flex: 1;
        padding: ${styling.spacing.medium}px;
        border: 1px solid ${styling.colors.border};
        border-radius: 4px;
        background-color: #f9f9f9;
      }

      .address-title {
        font-size: 14px;
        color: ${styling.colors.primary};
        margin-bottom: ${styling.spacing.small}px;
        font-weight: bold;
      }

      .address-name {
        font-weight: bold;
        margin-bottom: ${styling.spacing.small / 2}px;
      }

      .address-line, .address-phone {
        margin-bottom: 2px;
        font-size: 11px;
      }

      /* Items table */
      .table-container {
        overflow-x: auto;
      }

      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: ${styling.spacing.small}px;
      }

      .items-table th {
        background-color: ${styling.colors.primary};
        color: white;
        padding: ${styling.spacing.small}px;
        text-align: left;
        font-weight: bold;
        font-size: 11px;
      }

      .items-table td {
        padding: ${styling.spacing.small}px;
        border-bottom: 1px solid ${styling.colors.border};
        vertical-align: top;
        font-size: 11px;
      }

      .item-row.even {
        background-color: #f9f9f9;
      }

      .item-col { width: 40%; }
      .sku-col { width: 15%; }
      .qty-col { width: 10%; text-align: center; }
      .price-col { width: 15%; text-align: right; }
      .total-col { width: 20%; text-align: right; }

      .product-details {
        display: flex;
        align-items: flex-start;
        gap: ${styling.spacing.small}px;
      }

      .product-image {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
        flex-shrink: 0;
        border: 1px solid ${styling.colors.border};
      }

      /* Enhanced product information styles */
      .items-summary {
        margin-bottom: ${styling.spacing.small}px;
        text-align: right;
      }

      .items-count {
        font-size: 11px;
        color: #666;
        font-style: italic;
      }

      .product-image-container {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid ${styling.colors.border};
      }

      .product-image-placeholder {
        width: 40px;
        height: 40px;
        background-color: #f8f9fa;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        border: 1px solid ${styling.colors.border};
      }

      .placeholder-icon {
        width: 20px;
        height: 20px;
        color: #adb5bd;
        stroke-width: 1.5;
      }

      .zero-price-badge {
        display: inline-block;
        background-color: #d4edda;
        color: #155724;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        margin-top: 2px;
      }

      .sku-code {
        font-family: ${styling.fonts.monospace};
        background-color: #f8f9fa;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 10px;
        border: 1px solid #e9ecef;
      }

      .no-sku {
        color: #6c757d;
        font-style: italic;
      }

      .quantity-value {
        font-weight: bold;
      }

      .quantity-unit {
        font-size: 10px;
        color: #6c757d;
        margin-left: 2px;
      }

      .free-price {
        color: #28a745;
        font-weight: bold;
        font-style: italic;
      }

      .unit-price {
        font-weight: bold;
      }

      .item-total {
        font-size: 13px;
      }

      .zero-total {
        color: #28a745;
      }

      .items-subtotal {
        border-top: 2px solid ${styling.colors.primary};
        background-color: #f8f9fa;
      }

      .subtotal-label {
        text-align: right;
        padding: ${styling.spacing.small}px;
        color: ${styling.colors.primary};
      }

      .subtotal-value {
        text-align: right;
        padding: ${styling.spacing.small}px;
        color: ${styling.colors.primary};
        font-size: 14px;
      }

      .product-text {
        flex: 1;
      }

      .product-name {
        font-weight: bold;
        display: block;
        margin-bottom: 2px;
      }

      .product-description, .product-category {
        font-size: 10px;
        color: #666;
        display: block;
        margin-bottom: 1px;
      }

      .sku-cell, .qty-cell {
        text-align: center;
      }

      .price-cell, .total-cell {
        text-align: right;
        font-weight: bold;
      }

      /* Summary section */
      .summary-container {
        display: flex;
        justify-content: flex-end;
      }

      .summary-table {
        width: 300px;
        border-collapse: collapse;
      }

      .summary-row td {
        padding: ${styling.spacing.small / 2}px ${styling.spacing.small}px;
        border-bottom: 1px solid ${styling.colors.border};
      }

      .summary-label {
        text-align: left;
        font-weight: normal;
      }

      .summary-value {
        text-align: right;
        font-weight: bold;
        min-width: 80px;
      }

      .summary-row.discount .summary-value {
        color: #e74c3c;
      }

      .summary-row.total {
        border-top: 2px solid ${styling.colors.primary};
        border-bottom: 2px solid ${styling.colors.primary};
        font-size: 14px;
      }

      .summary-row.total .summary-label,
      .summary-row.total .summary-value {
        font-weight: bold;
        color: ${styling.colors.primary};
      }

      /* Payment section */
      .payment-content {
        display: flex;
        gap: ${styling.spacing.medium}px;
        align-items: flex-start;
      }

      .payment-details {
        flex: 1;
        background-color: #f9f9f9;
        padding: ${styling.spacing.medium}px;
        border-radius: 4px;
        border: 1px solid ${styling.colors.border};
      }

      .payment-row {
        display: flex;
        margin-bottom: ${styling.spacing.small / 2}px;
        align-items: flex-start;
      }

      .payment-label {
        font-weight: bold;
        min-width: 140px;
        color: ${styling.colors.primary};
        flex-shrink: 0;
      }

      .payment-value {
        flex: 1;
        word-break: break-word;
      }

      /* Payment method type specific styling */
      .payment-method-bank_transfer {
        color: #2980b9;
        font-weight: bold;
      }

      .payment-method-cash_on_delivery {
        color: #27ae60;
        font-weight: bold;
      }

      .payment-method-qr_code {
        color: #8e44ad;
        font-weight: bold;
      }

      /* Payment status styling */
      .status-pending {
        color: #f39c12;
        font-weight: bold;
      }
      .status-completed {
        color: #27ae60;
        font-weight: bold;
      }
      .status-failed {
        color: #e74c3c;
        font-weight: bold;
      }

      /* Bank transfer specific styling */
      .account-name {
        font-weight: bold;
        color: #2c3e50;
      }

      .account-number {
        font-family: ${styling.fonts.monospace};
        background-color: #ecf0f1;
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: bold;
      }

      .bank-name {
        color: #34495e;
        font-weight: bold;
      }

      /* Cash on delivery specific styling */
      .cod-note {
        font-style: italic;
        color: #7f8c8d;
        font-size: 11px;
      }

      /* QR code provider styling */
      .qr-provider {
        color: #8e44ad;
        font-weight: bold;
      }

      .payment-instructions {
        margin-top: ${styling.spacing.small}px;
        padding-top: ${styling.spacing.small}px;
        border-top: 1px solid ${styling.colors.border};
      }

      .instructions-content {
        margin-top: ${styling.spacing.small / 2}px;
        font-size: 11px;
        line-height: 1.4;
        background-color: #fff3cd;
        padding: ${styling.spacing.small}px;
        border-radius: 3px;
        border-left: 4px solid #ffc107;
      }

      .qr-code-container {
        flex-shrink: 0;
        text-align: center;
        padding: ${styling.spacing.medium}px;
        border: 1px solid ${styling.colors.border};
        border-radius: 4px;
        background-color: #f9f9f9;
        min-width: 160px;
      }

      .qr-title {
        font-size: 12px;
        color: ${styling.colors.primary};
        margin-bottom: ${styling.spacing.small}px;
        font-weight: bold;
      }

      .qr-code-wrapper {
        background-color: white;
        padding: ${styling.spacing.small}px;
        border-radius: 4px;
        border: 1px solid ${styling.colors.border};
        margin-bottom: ${styling.spacing.small}px;
      }

      .qr-code {
        max-width: 120px;
        max-height: 120px;
        display: block;
        margin: 0 auto;
      }

      .qr-instruction {
        font-size: 10px;
        color: #666;
        margin: 0;
        line-height: 1.3;
      }

      .qr-error {
        color: #e74c3c;
        font-size: 11px;
        padding: ${styling.spacing.medium}px;
        background-color: #fdf2f2;
        border-radius: 4px;
        border: 1px solid #f5c6cb;
      }

      /* Shipping section */
      .shipping-content {
        background-color: #f9f9f9;
        padding: ${styling.spacing.medium}px;
        border-radius: 4px;
        border: 1px solid ${styling.colors.border};
      }

      .shipping-row {
        display: flex;
        margin-bottom: ${styling.spacing.small / 2}px;
      }

      .shipping-label {
        font-weight: bold;
        min-width: 140px;
        color: ${styling.colors.primary};
      }

      .shipping-value {
        flex: 1;
      }

      .tracking-number {
        font-family: ${styling.fonts.monospace};
        background-color: #e8e8e8;
        padding: 2px 4px;
        border-radius: 2px;
      }

      /* Footer styles */
      .document-footer {
        margin-top: ${styling.spacing.large}px;
        padding-top: ${styling.spacing.medium}px;
        border-top: 2px solid ${styling.colors.primary};
        page-break-inside: avoid;
      }

      .footer-content {
        display: flex;
        flex-direction: column;
        gap: ${styling.spacing.medium}px;
      }

      .footer-section {
        margin-bottom: ${styling.spacing.small}px;
      }

      .thank-you {
        text-align: center;
        padding-top: ${styling.spacing.medium}px;
        border-top: 1px solid ${styling.colors.border};
      }

      .thank-you-message {
        font-size: 14px;
        color: ${styling.colors.primary};
        font-weight: bold;
        margin-bottom: ${styling.spacing.small}px;
      }

      .generation-info {
        font-size: 10px;
        color: #666;
      }

      /* Page break helpers */
      .page-break-helper {
        page-break-after: always;
        visibility: hidden;
        height: 0;
      }

      /* Print-specific styles */
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .document-container {
          margin: 0;
          padding: 0;
        }

        .document-header {
          page-break-inside: avoid;
        }

        .items-table {
          page-break-inside: auto;
        }

        .items-table tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        .summary-section,
        .payment-section,
        .shipping-section {
          page-break-inside: avoid;
        }

        .document-footer {
          page-break-inside: avoid;
        }
      }

      /* Responsive adjustments for different content lengths */
      @media (max-width: 600px) {
        .header-content {
          flex-direction: column;
          gap: ${styling.spacing.small}px;
        }

        .document-info {
          text-align: left;
        }

        .address-container {
          flex-direction: column;
        }

        .payment-content {
          flex-direction: column;
        }

        .items-table {
          font-size: 10px;
        }

        .product-details {
          flex-direction: column;
          align-items: flex-start;
        }

        .product-image {
          width: 30px;
          height: 30px;
        }
      }
    `;
  }

  /**
   * Get localized payment status text
   */
  private getPaymentStatusText(status: string, locale: 'en' | 'vi'): string {
    const statusMap: Record<'en' | 'vi', Record<string, string>> = {
      en: {
        pending: 'Pending',
        completed: 'Completed',
        failed: 'Failed',
      },
      vi: {
        pending: 'Đang chờ',
        completed: 'Hoàn thành',
        failed: 'Thất bại',
      },
    };

    return statusMap[locale][status] || status;
  }
}