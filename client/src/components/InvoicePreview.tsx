import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceData, calculateTotals, calculateDueDate, paymentTerms } from "@/lib/invoice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InvoicePreviewProps {
  data: InvoiceData;
}

export default function InvoicePreview({ data }: InvoicePreviewProps) {
  const { t } = useTranslation();
  const { subtotal, vatAmount, total } = calculateTotals(data.products, data.vatRate);
  const dueDate = calculateDueDate(data.date, data.paymentTerm);

  return (
    <Card className="bg-background border">
      <CardContent className="p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">{t("invoice.title")}</h1>
          <div className="space-y-1">
            <p className="font-semibold">{data.name}</p>
            <p className="font-semibold">{data.companyName}</p>
            <p className="whitespace-pre-wrap">{data.address}</p>
            <p>{t("invoice.company.coc")}: {data.cocNumber}</p>
            <p>{t("invoice.company.vat")}: {data.vatNumber}</p>
            <p>{t("invoice.company.iban")}: {data.iban}</p>
          </div>
          <div className="text-right space-y-1">
            <p>
              <span className="font-semibold">{t("invoice.details.number")}:</span>{" "}
              {data.invoiceNumber}
            </p>
            <p>
              <span className="font-semibold">{t("invoice.details.date")}:</span>{" "}
              {format(data.date, "dd-MM-yyyy")}
            </p>
            <p>
              <span className="font-semibold">{t("invoice.details.dueDate")}:</span>{" "}
              {format(dueDate, "dd-MM-yyyy")}
            </p>
            <p>
              <span className="font-semibold">{t("invoice.details.paymentTerms")}:</span>{" "}
              {paymentTerms[data.paymentTerm]?.label || t("invoice.details.paymentTerms")}
            </p>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoice.products.description")}</TableHead>
                <TableHead className="text-right">{t("invoice.products.quantity")}</TableHead>
                <TableHead className="text-right">{t("invoice.products.price")}</TableHead>
                <TableHead className="text-right">{t("invoice.products.total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{product.description}</TableCell>
                  <TableCell className="text-right">{product.quantity}</TableCell>
                  <TableCell className="text-right">{data.currency} {product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {data.currency} {(product.quantity * product.price).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span>{t("invoice.vat.subtotal")}:</span>
              <span>{data.currency} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("invoice.vat.rate")} {data.vatRate}%:</span>
              <span>{data.currency} {vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>{t("invoice.vat.total")}:</span>
              <span>{data.currency} {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="mt-8">
            <h3 className="font-semibold mb-2">{t("invoice.details.notes")}:</h3>
            <p className="whitespace-pre-wrap text-muted-foreground">{data.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}