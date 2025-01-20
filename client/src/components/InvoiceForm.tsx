import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import ProductTable from "./ProductTable";
import { InvoiceData, generatePDF } from "@/lib/invoice";
import { useToast } from "@/hooks/use-toast";

export default function InvoiceForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const form = useForm<InvoiceData>({
    defaultValues: {
      products: [{ description: "", quantity: 1, price: 0 }],
      vatRate: 21,
      date: new Date(),
    },
  });

  const onSubmit = (data: InvoiceData) => {
    try {
      const doc = generatePDF(data);
      doc.save(`invoice-${data.invoiceNumber}.pdf`);
      toast({
        title: "Success",
        description: "Invoice PDF has been generated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="companyName">{t("invoice.company.name")}</Label>
          <Input
            id="companyName"
            {...form.register("companyName", { required: true })}
          />
        </div>
        
        <div>
          <Label htmlFor="address">{t("invoice.company.address")}</Label>
          <Input
            id="address"
            {...form.register("address", { required: true })}
          />
        </div>

        <div>
          <Label htmlFor="cocNumber">{t("invoice.company.coc")}</Label>
          <Input
            id="cocNumber"
            {...form.register("cocNumber", { required: true })}
          />
        </div>

        <div>
          <Label htmlFor="vatNumber">{t("invoice.company.vat")}</Label>
          <Input
            id="vatNumber"
            {...form.register("vatNumber", { required: true })}
          />
        </div>

        <div>
          <Label htmlFor="iban">{t("invoice.company.iban")}</Label>
          <Input
            id="iban"
            {...form.register("iban", { required: true })}
          />
        </div>

        <div>
          <Label>{t("invoice.details.date")}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(form.watch("date"), "PP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={form.watch("date")}
                onSelect={(date) => form.setValue("date", date || new Date())}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ProductTable form={form} />

      <div>
        <Label htmlFor="notes">{t("invoice.details.notes")}</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="submit">
          {t("common.download")}
        </Button>
      </div>
    </form>
  );
}
