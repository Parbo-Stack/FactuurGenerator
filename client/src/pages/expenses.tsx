import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ExpenseFormData {
  date: Date;
  amount: number;
  category: string;
  description: string;
  taxDeductible: boolean;
  attachments: File[];
}

export default function ExpensesPage() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const form = useForm<ExpenseFormData>({
    defaultValues: {
      date: new Date(),
      amount: 0,
      category: "other",
      description: "",
      taxDeductible: false,
      attachments: [],
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      // TODO: Implement API call to save expense
      console.log("Saving expense:", data);
      toast({
        title: t("common.success"),
        description: t("expenses.messages.saved"),
      });
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast({
        title: t("common.error"),
        description: t("expenses.messages.error"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("expenses.add")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Label>{t("expenses.form.date")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date || new Date());
                        form.setValue("date", date || new Date());
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="amount">{t("expenses.form.amount")}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...form.register("amount", { required: true, min: 0 })}
                />
              </div>

              <div>
                <Label htmlFor="category">{t("expenses.form.category")}</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value) => form.setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t("expenses.categories", { returnObjects: true })).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label as string}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="taxDeductible" className="flex items-center space-x-2">
                  <Switch
                    id="taxDeductible"
                    checked={form.watch("taxDeductible")}
                    onCheckedChange={(checked) => form.setValue("taxDeductible", checked)}
                  />
                  <span>{t("expenses.form.taxDeductible")}</span>
                </Label>
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">{t("expenses.form.description")}</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  className="h-24"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="submit">{t("expenses.form.submit")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
