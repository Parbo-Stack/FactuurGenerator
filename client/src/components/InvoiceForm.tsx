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
              import { InvoiceData, generatePDF, PaymentTerm, paymentTerms, calculateDueDate } from "@/lib/invoice";
              import { useToast } from "@/hooks/use-toast";
              import { useState, useEffect } from "react";

              export default function InvoiceForm() {
                const { t } = useTranslation();
                const { toast } = useToast();
                const [showPreview, setShowPreview] = useState(false);
                const [logoFile, setLogoFile] = useState<File | null>(null);
                const [logoPreview, setLogoPreview] = useState<string | null>(null);
                const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

                const savedData = localStorage.getItem('invoiceFormData');
                const defaultValues = savedData ? JSON.parse(savedData) : {
                  companyName: "",
                  name: "",
                  address: "",
                  cocNumber: "",
                  vatNumber: "",
                  iban: "",
                  invoiceNumber: "",
                  products: [{ description: "", quantity: 1, price: 0 }],
                  vatRate: 21 as const,
                  currency: "EUR" as const,
                  date: new Date(),
                  paymentTerm: "14_days" as PaymentTerm, // Ensure this matches one of the valid payment terms
                  notes: ""
                };

                if (defaultValues.date) {
                  defaultValues.date = new Date(defaultValues.date);
                }

                const form = useForm<InvoiceData>({
                  defaultValues,
                });

                useEffect(() => {
                  const subscription = form.watch((value, { name }) => {
                    if (name === 'currency') {
                      form.trigger('products');
                    }
                    localStorage.setItem('invoiceFormData', JSON.stringify(value));
                  });
                  return () => subscription.unsubscribe();
                }, [form]);

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

                const downloadPDF = async (blob: Blob, filename: string) => {
                  try {
                    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
                      const reader = new FileReader();
                      reader.onload = function (e) {
                        const data = e.target?.result;
                        if (data) {
                          const link = document.createElement('a');
                          link.href = data as string;
                          link.download = filename;
                          link.click();
                        }
                      };
                      reader.readAsDataURL(blob);
                    } else {
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.style.display = 'none';
                      link.href = url;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      setTimeout(() => {
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      }, 100);
                    }
                  } catch (error) {
                    console.error('Download error:', error);
                    throw error;
                  }
                };

                const onSubmit = async (data: InvoiceData) => {
                  if (isGeneratingPDF) return;

                  setIsGeneratingPDF(true);
                  try {
                    // Validate payment term
                    if (!data.paymentTerm || !paymentTerms[data.paymentTerm]) {
                      throw new Error('Invalid payment term');
                    }

                    const doc = await generatePDF(data, logoPreview);
                    if (!doc) {
                      throw new Error('Failed to generate PDF');
                    }

                    const pdfBlob = doc.output('blob');
                    const filename = `factuur-${data.invoiceNumber || 'ongenummerd'}.pdf`;

                    await downloadPDF(pdfBlob, filename);

                    toast({
                      title: t("common.success"),
                      description: t("invoice.pdfGenerated"),
                    });
                  } catch (error) {
                    console.error("PDF generation/download error:", error);
                    toast({
                      title: t("common.error"),
                      description: t("invoice.pdfError"),
                      variant: "destructive",
                    });
                  } finally {
                    setIsGeneratingPDF(false);
                  }
                };

                const watchDate = form.watch("date");
                const watchPaymentTerm = form.watch("paymentTerm");
                const dueDate = calculateDueDate(watchDate, watchPaymentTerm);

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
                        <Label htmlFor="name">{t("invoice.name")}</Label>
                        <Input
                          id="name"
                          {...form.register("name", { required: true })}
                        />
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
                        <Label htmlFor="paymentTerm">{t("invoice.details.paymentTerms")}</Label>
                        <Select
                          value={form.watch("paymentTerm")}
                          onValueChange={(value) => form.setValue("paymentTerm", value as PaymentTerm)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(paymentTerms).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>{t("invoice.details.dueDate")}</Label>
                        <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                          {format(dueDate, "PP")}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="vatRate">{t("invoice.vat.rate")}</Label>
                        <Select
                          value={form.watch("vatRate")}
                          onValueChange={(value) => form.setValue("vatRate", value as number)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 9, 21].map((rate) => (
                              <SelectItem key={rate} value={rate}>
                                {rate}%
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <ProductTable
                      form={form}
                    />

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? t("invoice.preview.hide") : t("invoice.preview.show")}
                      </Button>
                      <Button type="submit">{t("invoice.generate")}</Button>
                    </div>

                    {showPreview && <InvoicePreview data={form.getValues()} />}
                  </form>
                );
              }
