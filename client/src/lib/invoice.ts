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
};

export const calculateTotals = (products: Product[], vatRate: number) => {
  const subtotal = products.reduce((sum, product) => sum + product.price * product.quantity, 0);
  const vatAmount = (subtotal * vatRate) / 100;
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
};

export const formatCurrency = (amount: number, currency: keyof typeof currencySymbols) => {
  return `${currencySymbols[currency]} ${amount.toFixed(2)}`;
};

export const generatePDF = (data: InvoiceData) => {
  const doc = new jsPDF();
  const { subtotal, vatAmount, total } = calculateTotals(data.products, data.vatRate);
  const currency = currencySymbols[data.currency];

  // Header
  doc.setFontSize(20);
  doc.text("FACTUUR", 20, 20);

  // Company details
  doc.setFontSize(12);
  doc.text([
    data.companyName,
    data.address,
    `KvK: ${data.cocNumber}`,
    `BTW: ${data.vatNumber}`,
    `IBAN: ${data.iban}`,
  ], 20, 40);

  // Invoice details
  doc.text([
    `Factuurnummer: ${data.invoiceNumber}`,
    `Datum: ${data.date.toLocaleDateString("nl-NL")}`,
  ], 120, 40);

  // Products table
  let y = 80;
  doc.text("Omschrijving", 20, y);
  doc.text("Aantal", 100, y);
  doc.text("Prijs", 140, y);
  doc.text("Totaal", 180, y);

  y += 10;
  data.products.forEach(product => {
    doc.text(product.description, 20, y);
    doc.text(product.quantity.toString(), 100, y);
    doc.text(`${currency} ${product.price.toFixed(2)}`, 140, y);
    doc.text(`${currency} ${(product.quantity * product.price).toFixed(2)}`, 180, y);
    y += 10;
  });

  // Totals
  y += 10;
  doc.text(`Subtotaal: ${currency} ${subtotal.toFixed(2)}`, 140, y);
  doc.text(`BTW ${data.vatRate}%: ${currency} ${vatAmount.toFixed(2)}`, 140, y + 10);
  doc.text(`Totaal: ${currency} ${total.toFixed(2)}`, 140, y + 20);

  // Notes
  if (data.notes) {
    y += 40;
    doc.text("Opmerkingen:", 20, y);
    doc.text(data.notes, 20, y + 10);
  }

  return doc;
};