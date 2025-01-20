import { jsPDF } from "jspdf";

export interface Product {
  description: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  companyName: string;
  address: string;
  cocNumber: string;
  vatNumber: string;
  iban: string;
  invoiceNumber: string;
  date: Date;
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

export const generatePDF = (data: InvoiceData, logoDataUrl?: string | null) => {
  const doc = new jsPDF();
  const { subtotal, vatAmount, total } = calculateTotals(data.products, data.vatRate);
  const currency = currencySymbols[data.currency];
  const pageWidth = doc.internal.pageSize.width;

  // Helper function to draw horizontal line
  const drawLine = (y: number) => {
    doc.setDrawColor(200, 200, 200); // Light gray color for lines
    doc.setLineWidth(0.1);
    doc.line(20, y, pageWidth - 20, y);
  };

  // Logo
  let startY = 20;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'JPEG', 20, startY, 30, 30);
    startY = 60;
  }

  // Header
  doc.setFontSize(20);
  doc.text("FACTUUR", logoDataUrl ? 60 : 20, 20);

  // Company details
  doc.setFontSize(12);
  doc.text([
    data.companyName,
    data.address,
    `KvK: ${data.cocNumber}`,
    `BTW: ${data.vatNumber}`,
    `IBAN: ${data.iban}`,
  ], 20, startY);

  // Invoice details
  doc.text([
    `Factuurnummer: ${data.invoiceNumber}`,
    `Datum: ${data.date.toLocaleDateString("nl-NL")}`,
  ], 120, startY);

  // Line after header
  drawLine(startY + 30);

  // Products table
  let y = startY + 40;

  // Table header
  doc.setFont(undefined, 'bold');
  doc.text("Omschrijving", 20, y);
  doc.text("Aantal", 100, y);
  doc.text("Prijs", 140, y);
  doc.text("Totaal", 180, y);
  doc.setFont(undefined, 'normal');

  // Line after table header
  drawLine(y + 3);

  // Table content
  y += 15;
  data.products.forEach((product, index) => {
    doc.text(product.description, 20, y);
    doc.text(product.quantity.toString(), 100, y);
    doc.text(`${currency} ${product.price.toFixed(2)}`, 140, y);
    doc.text(`${currency} ${(product.quantity * product.price).toFixed(2)}`, 180, y);
    y += 10;
  });

  // Line before totals
  drawLine(y + 3);

  // Totals
  y += 15;
  doc.text(`Subtotaal:`, 140, y);
  doc.text(`${currency} ${subtotal.toFixed(2)}`, 180, y);

  y += 10;
  doc.text(`BTW ${data.vatRate}%:`, 140, y);
  doc.text(`${currency} ${vatAmount.toFixed(2)}`, 180, y);

  y += 10;
  doc.setFont(undefined, 'bold');
  doc.text(`Totaal:`, 140, y);
  doc.text(`${currency} ${total.toFixed(2)}`, 180, y);
  doc.setFont(undefined, 'normal');

  // Line before notes
  if (data.notes) {
    drawLine(y + 15);
    y += 25;
    doc.text("Opmerkingen:", 20, y);
    doc.text(data.notes, 20, y + 10);
  }

  return doc;
};