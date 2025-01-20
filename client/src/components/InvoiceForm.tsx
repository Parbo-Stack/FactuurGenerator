import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload } from "lucide-react";
import ProductTable from "@/components/ProductTable";
import InvoicePreview from "@/components/InvoicePreview";
import { InvoiceData, generatePDF } from "@/lib/invoice";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function InvoiceForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<InvoiceData>({
    defaultValues: {
      companyName: "",
      address: "",
      cocNumber: "",
      vatNumber: "",
      iban: "",
      invoiceNumber: "",
      products: [{ description: "", quantity: 1, price: 0 }],
      vatRate: 21 as const,
      currency: "EUR" as const,
      date: new Date(),
    },
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: InvoiceData) => {
    try {
      const doc = generatePDF(data, logoPreview);
      doc.save(`invoice-${data.invoiceNumber}.pdf`);
      toast({
        title: t("common.success"),
        description: t("invoice.pdfGenerated"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("invoice.pdfError"),
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="col-span-2">
          <Label htmlFor="logo">{t("invoice.company.logo")}</Label>
          <div className="mt-2 flex items-center gap-4">
            {logoPreview && (
              <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-contain" />
            )}
            <div className="relative">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("logo")?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {t("invoice.company.uploadLogo")}
              </Button>
            </div>
          </div>
        </div>

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
          <Label htmlFor="invoiceNumber">{t("invoice.details.number")}</Label>
          <Input
            id="invoiceNumber"
            {...form.register("invoiceNumber", { required: true })}
            placeholder="e.g., INV-001"
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

        <div>
          <Label htmlFor="vatRate">{t("invoice.vat.rate")}</Label>
          <Select
            value={form.watch("vatRate").toString()}
            onValueChange={(value) => form.setValue("vatRate", parseInt(value) as 9 | 21)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9">9%</SelectItem>
              <SelectItem value="21">21%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={form.watch("currency")}
            onValueChange={(value) => form.setValue("currency", value as "EUR" | "USD" | "GBP")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
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
        <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
          {t("common.preview")}
        </Button>
        <Button type="submit">
          {t("common.download")}
        </Button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end mb-4">
              <Button variant="ghost" onClick={() => setShowPreview(false)}>
                ✕
              </Button>
            </div>
            <InvoicePreview data={form.getValues()} />
          </div>
        </div>
      )}
    </form>
  );
}