import { type Theme } from "@/lib/types";

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // Path to preview image
  theme: Theme;
  styles: {
    title: {
      color: string;
      fontSize: number;
    };
    header: {
      layout: "classic" | "modern" | "minimal";
      logoPosition: "left" | "right" | "center";
    };
    content: {
      tableStyle: "bordered" | "minimal" | "striped";
      fontFamily: string;
    };
  };
}

export const invoiceTemplates: InvoiceTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional professional invoice design",
    preview: "/templates/classic.png",
    theme: {
      primary: "hsl(222.2 47.4% 11.2%)",
      radius: 0.5,
      variant: "professional",
    },
    styles: {
      title: {
        color: "rgb(0, 100, 0)",
        fontSize: 24,
      },
      header: {
        layout: "classic",
        logoPosition: "right",
      },
      content: {
        tableStyle: "bordered",
        fontFamily: "helvetica",
      },
    },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean and minimalist design",
    preview: "/templates/modern.png",
    theme: {
      primary: "hsl(200 95% 14%)",
      radius: 1,
      variant: "professional",
    },
    styles: {
      title: {
        color: "rgb(0, 124, 145)",
        fontSize: 28,
      },
      header: {
        layout: "modern",
        logoPosition: "left",
      },
      content: {
        tableStyle: "minimal",
        fontFamily: "helvetica",
      },
    },
  },
  {
    id: "creative",
    name: "Creative",
    description: "Bold and colorful design",
    preview: "/templates/creative.png",
    theme: {
      primary: "hsl(280 65% 25%)",
      radius: 1.5,
      variant: "vibrant",
    },
    styles: {
      title: {
        color: "rgb(100, 40, 145)",
        fontSize: 26,
      },
      header: {
        layout: "modern",
        logoPosition: "center",
      },
      content: {
        tableStyle: "striped",
        fontFamily: "helvetica",
      },
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
