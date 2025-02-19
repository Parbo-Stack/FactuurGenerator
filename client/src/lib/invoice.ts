import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format, addDays } from "date-fns";
import i18n from "./i18n";
import QRCode from "qrcode";

export interface Product {
  description: string;
  quantity: number;
  price: number;
}

// Define payment term as string literal type
export type PaymentTerm = "14_days" | "30_days" | "net_15" | "net_60";

export const paymentTerms: Record<PaymentTerm, { label: string; days: number }> = {
  "14_days": { label: "14 dagen", days: 14 },
  "30_days": { label: "30 dagen", days: 30 },
  "net_15": { label: "Netto 15", days: 15 },
  "net_60": { label: "Netto 60", days: 60 },
} as const;

// Function to validate payment term
export const isValidPaymentTerm = (term: string | null | undefined): term is PaymentTerm => {
  if (!term) return false;
  return Object.keys(paymentTerms).includes(term);
};

export interface InvoiceData {
  companyName: string;
  name: string;
  address: string;
  cocNumber: string;
  vatNumber: string;
  iban: string;
  invoiceNumber: string;
  date: Date;
  paymentTerm: PaymentTerm;
  products: Product[];
  vatRate: 9 | 21;
  currency: "EUR" | "USD" | "GBP";
  notes?: string;
}

const currencySymbols = {
  EUR: "€",
  USD: "$",
  GBP: "£",
} as const;

export const calculateTotals = (products: Product[], vatRate: number) => {
  const subtotal = products.reduce((sum, product) => sum + product.price * product.quantity, 0);
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
};

export const formatCurrency = (amount: number, currency: keyof typeof currencySymbols) => {
  return `${currencySymbols[currency]} ${amount.toFixed(2)}`;
};

export const calculateDueDate = (date: Date, paymentTerm: PaymentTerm): Date => {
  if (!date || !paymentTerm || !paymentTerms[paymentTerm]) {
    return new Date(); // Return current date as fallback
  }
  return addDays(date, paymentTerms[paymentTerm].days);
};

// Safe translation function with fallback
const safeTranslate = (key: string, fallback: string): string => {
  try {
    const translation = i18n.t(key);
    return translation === key ? fallback : translation;
  } catch (error) {
    console.warn(`Translation failed for key: ${key}, using fallback`);
    return fallback;
  }
};

// Add new function for generating payment QR code
const generatePaymentQRCode = async (data: InvoiceData, total: number): Promise<string> => {
  // Format according to the EPC QR standard for SEPA payments
  const qrData = [
    'BCD',                              // Service Tag
    '002',                             // Version
    '1',                               // Character Set
    'SCT',                             // Identification
    data.iban.replace(/\s/g, ''),      // IBAN
    data.companyName,                  // Beneficiary Name
    total.toFixed(2),                  // Amount
    'EUR',                             // Currency
    '',                                // Purpose (empty)
    data.invoiceNumber,                // Remittance Reference
    `Invoice ${data.invoiceNumber}`    // Additional remittance information
  ].join('\n');

  try {
    return await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 150
    });
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw error;
  }
};

export const generatePDF = async (data: InvoiceData, logoDataUrl?: string | null): Promise<jsPDF> => {
  try {
    if (!isValidPaymentTerm(data.paymentTerm)) {
      throw new Error("Invalid payment term provided.");
    }
    const doc = new jsPDF();
    const { subtotal, vatAmount, total } = calculateTotals(data.products, data.vatRate);
    const currency = currencySymbols[data.currency];
    const pageWidth = doc.internal.pageSize.width;
    const dueDate = calculateDueDate(data.date, data.paymentTerm);

    // Generate QR code for payment
    const qrCodeDataUrl = await generatePaymentQRCode(data, total);

    // Helper function to draw horizontal line
    const drawLine = (y: number) => {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(20, y, pageWidth - 20, y);
    };

    // Header - Title (FACTUUR)
    let currentY = 30;
    doc.setFontSize(24);
    doc.setTextColor(0, 100, 0); // Dark green color for FACTUUR only
    doc.setFont("helvetica", "bold");

    const title = safeTranslate("invoice.title", "Factuur");
    doc.text(title, 20, currentY);
    doc.setTextColor(0, 0, 0); // Reset to black for rest of the text

    // Logo on right if provided
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'JPEG', pageWidth - 50, currentY - 20, 30, 30);
    }
    currentY += 20;

    // Company and personal details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const leftDetails = [
      data.name,
      data.companyName,
      data.address,
      `${safeTranslate("invoice.company.coc", "KvK")}: ${data.cocNumber}`,
      `${safeTranslate("invoice.company.vat", "BTW")}: ${data.vatNumber}`,
      `${safeTranslate("invoice.company.iban", "IBAN")}: ${data.iban}`,
    ];

    const rightDetails = [
      `${safeTranslate("invoice.details.number", "Factuurnummer")}: ${data.invoiceNumber}`,
      `${safeTranslate("invoice.details.date", "Datum")}: ${format(data.date, 'dd-MM-yyyy')}`,
      `${safeTranslate("invoice.details.dueDate", "Vervaldatum")}: ${format(dueDate, 'dd-MM-yyyy')}`,
      `${safeTranslate("invoice.details.paymentTerms", "Betalingstermijn")}: ${paymentTerms[data.paymentTerm]?.label || "14 dagen"}`,
    ];

    doc.text(leftDetails, 20, currentY);
    doc.text(rightDetails, pageWidth - 90, currentY);

    currentY += 50;
    drawLine(currentY);
    currentY += 15;

    // Table headers
    const headers = [[
      safeTranslate("invoice.products.description", "Omschrijving"),
      safeTranslate("invoice.products.quantity", "Aantal"),
      safeTranslate("invoice.products.price", "Prijs"),
      safeTranslate("invoice.products.total", "Totaal")
    ]];

    // Table header row
    doc.setFont("helvetica", "bold");
    doc.text(headers[0][0], 20, currentY);
    doc.text(headers[0][1], pageWidth - 150, currentY, { align: "right" });
    doc.text(headers[0][2], pageWidth - 100, currentY, { align: "right" });
    doc.text(headers[0][3], pageWidth - 20, currentY, { align: "right" });

    doc.setFont("helvetica", "normal");
    currentY += 5;
    drawLine(currentY);
    currentY += 10;

    // Table content
    data.products.forEach((product) => {
      doc.text(product.description, 20, currentY);
      doc.text(product.quantity.toString(), pageWidth - 150, currentY, { align: "right" });
      doc.text(`${currency} ${product.price.toFixed(2)}`, pageWidth - 100, currentY, { align: "right" });
      doc.text(
        `${currency} ${(product.quantity * product.price).toFixed(2)}`,
        pageWidth - 20,
        currentY,
        { align: "right" }
      );
      currentY += 8;
    });

    currentY += 5;
    drawLine(currentY);
    currentY += 15;

    // Totals section
    const startX = pageWidth - 80;
    doc.text(`${safeTranslate("invoice.vat.subtotal", "Subtotaal")}:`, startX, currentY);
    doc.text(`${currency} ${subtotal.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

    currentY += 8;
    doc.text(`${safeTranslate("invoice.vat.rate", "BTW")} (${data.vatRate}%)`, startX, currentY);
    doc.text(`${currency} ${vatAmount.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

    currentY += 8;
    doc.setFont("helvetica", "bold");
    doc.text(safeTranslate("invoice.vat.total", "Totaal incl. BTW"), startX, currentY);
    doc.text(`${currency} ${total.toFixed(2)}`, pageWidth - 20, currentY, { align: "right" });

    // Add QR code at the bottom right
    if (qrCodeDataUrl) {
      const qrSize = 40;
      const qrY = doc.internal.pageSize.height - 60;
      doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - qrSize - 20, qrY, qrSize, qrSize);

      // Add QR code label
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const label = safeTranslate("invoice.payment.scanQR", "Scan QR code voor betaling");
      doc.text(label, pageWidth - qrSize - 20, qrY + qrSize + 5);
    }

    // Notes (move up slightly to make room for QR code)
    if (data.notes) {
      currentY = doc.internal.pageSize.height - 70;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${safeTranslate("invoice.details.notes", "Opmerkingen")}: ${data.notes}`, 20, currentY);
    }

    return doc;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Helper function to convert hex/rgb color to RGB array
function hexToRgb(color: string): [number, number, number] {
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches) {
      return [parseInt(matches[0]), parseInt(matches[1]), parseInt(matches[2])];
    }
  }
  // Default to black if color parsing fails
  return [0, 0, 0];
}