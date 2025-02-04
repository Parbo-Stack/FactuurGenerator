
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { InvoiceData } from "@/lib/invoice";

interface ProductTableProps {
  form: UseFormReturn<InvoiceData>;
}

const formatCurrency = (amount: number, currency: string): string => {
  const locale = currency === 'EUR' ? 'nl-NL' : 'en-US';
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
};

export default function ProductTable({ form }: ProductTableProps) {
  const { t } = useTranslation();
  const products = form.watch("products");
  const vatRate = form.watch("vatRate");
  const currency = form.watch("currency");

  const addProduct = () => {
    const currentProducts = form.getValues("products");
    form.setValue("products", [
      ...currentProducts,
      { description: "", quantity: 1, price: 0 },
    ]);
  };

  const removeProduct = (index: number) => {
    const currentProducts = form.getValues("products");
    form.setValue(
      "products",
      currentProducts.filter((_, i) => i !== index)
    );
  };

  const subtotal = products.reduce((sum, product) => sum + product.quantity * product.price, 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("invoice.products.description")}</TableHead>
            <TableHead>{t("invoice.products.quantity")}</TableHead>
            <TableHead>{t("invoice.products.price")}</TableHead>
            <TableHead>{t("invoice.products.total")}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Input
                  {...form.register(`products.${index}.description`)}
                  placeholder={t("invoice.products.description")}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  {...form.register(`products.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register(`products.${index}.price`, {
                    valueAsNumber: true,
                  })}
                />
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(products[index].quantity * products[index].price, currency)}
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProduct(index)}
                  disabled={products.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-start">
        <Button
          type="button"
          variant="outline"
          onClick={addProduct}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("invoice.products.add")}
        </Button>

        <div className="space-y-2 text-right">
          <p>Subtotal: {formatCurrency(subtotal, currency)}</p>
          <p>
            {t("invoice.vat.amount")} ({vatRate}%): {formatCurrency(vatAmount, currency)}
          </p>
          <p className="font-bold">
            {t("invoice.vat.total")}: {formatCurrency(total, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
