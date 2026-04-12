import { type Theme } from "@/lib/types";

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  layout: "classic" | "modern";
  theme: Theme;
}

export const invoiceTemplates: InvoiceTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional professional layout",
    layout: "classic",
    theme: {
      primary: "hsl(222.2 47.4% 11.2%)",
      radius: 0.5,
      variant: "professional",
    },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean and minimalist design",
    layout: "modern",
    theme: {
      primary: "hsl(200 95% 14%)",
      radius: 1,
      variant: "professional",
    },
  },
];

export const getTemplateById = (id: string): InvoiceTemplate => {
  const template = invoiceTemplates.find(t => t.id === id);
  if (!template) {
    return invoiceTemplates[0]; // Return classic template as default
  }
  return template;
};