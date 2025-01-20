import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { InvoiceData, Product, calculateTotals } from "@/lib/invoice";

interface ProductTableProps {
  form: UseFormReturn<InvoiceData>;
}

export default function ProductTable({ form }: ProductTableProps) {
  const { t } = useTranslation();
  const products = form.watch("products");
  const vatRate = form.watch("vatRate");

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

  const { subtotal, vatAmount, total } = calculateTotals(products, vatRate);

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
          {products.map((product: Product, index: number) => (
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
              <TableCell>
                € {(product.quantity * product.price).toFixed(2)}
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
          <p>Subtotal: € {subtotal.toFixed(2)}</p>
          <p>
            {t("invoice.vat.amount")} ({vatRate}%): € {vatAmount.toFixed(2)}
          </p>
          <p className="font-bold">
            {t("invoice.vat.total")}: € {total.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
