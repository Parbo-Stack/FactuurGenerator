import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, Search } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import IncomeList from "@/components/IncomeList";
import type { SelectIncome } from "@db/schema";

interface IncomeFormData {
  date: Date;
  amount: number;
  source: string;
  category: string;
  description: string;
  paymentMethod: string;
}

interface IncomeFilters {
  startDate?: string;
  endDate?: string;
  source?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

const INCOME_CATEGORIES = {
  salary: "Salary",
  freelance: "Freelance",
  investments: "Investments",
  other: "Other",
};

const PAYMENT_METHODS = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  paypal: "PayPal",
  other: "Other",
};

export default function IncomePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<IncomeFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [editingIncome, setEditingIncome] = useState<SelectIncome | null>(null);

  const form = useForm<IncomeFormData>({
    defaultValues: {
      date: new Date(),
      amount: 0,
      source: "",
      category: "other",
      description: "",
      paymentMethod: "bank_transfer",
    },
  });

  // Fetch income entries
  const { data: incomeEntries = [], isLoading } = useQuery({
    queryKey: ['/api/income', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      const response = await fetch(`/api/income?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch income entries');
      }
      return response.json();
    },
  });

  // Create income mutation
  const createIncome = useMutation({
    mutationFn: async (data: IncomeFormData) => {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create income entry');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/income'] });
      toast({
        title: t("common.success"),
        description: t("income.messages.saved"),
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("income.messages.error"),
        variant: "destructive",
      });
    },
  });

  // Update income mutation
  const updateIncome = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: IncomeFormData }) => {
      const response = await fetch(`/api/income/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update income entry');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/income'] });
      toast({
        title: t("common.success"),
        description: t("income.messages.updated"),
      });
      setEditingIncome(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("income.messages.error"),
        variant: "destructive",
      });
    },
  });

  // Delete income mutation
  const deleteIncome = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/income/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete income entry');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/income'] });
      toast({
        title: t("common.success"),
        description: t("income.messages.deleted"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("income.messages.error"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: IncomeFormData) => {
    if (editingIncome) {
      updateIncome.mutate({ id: editingIncome.id, data });
    } else {
      createIncome.mutate(data);
    }
  };

  // Calculate total income for the filtered period
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Income Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{t("income.summary.total")}</h2>
            <p className="text-3xl font-bold text-primary">
              {new Intl.NumberFormat('nl-NL', {
                style: 'currency',
                currency: 'EUR'
              }).format(totalIncome)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Income Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingIncome ? t("income.edit") : t("income.add")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Label>{t("income.form.date")}</Label>
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
                <Label htmlFor="amount">{t("income.form.amount")}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...form.register("amount", { required: true, min: 0 })}
                />
              </div>

              <div>
                <Label htmlFor="source">{t("income.form.source")}</Label>
                <Input
                  id="source"
                  {...form.register("source", { required: true })}
                />
              </div>

              <div>
                <Label htmlFor="category">{t("income.form.category")}</Label>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value) => form.setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INCOME_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">{t("income.form.paymentMethod")}</Label>
                <Select
                  value={form.watch("paymentMethod")}
                  onValueChange={(value) => form.setValue("paymentMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">{t("income.form.description")}</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  className="h-24"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              {editingIncome && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingIncome(null);
                    form.reset();
                  }}
                >
                  {t("common.cancel")}
                </Button>
              )}
              <Button type="submit">
                {editingIncome ? t("common.save") : t("income.form.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("income.list.title")}</h2>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {t("income.list.filter")}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t("income.list.columns.date")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                  />
                  <Input
                    type="date"
                    onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>{t("income.list.columns.category")}</Label>
                <Select onValueChange={(value) => setFilters(f => ({ ...f, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INCOME_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("income.list.search")}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("income.list.search")}
                    className="pl-8"
                    onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income List */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <IncomeList
          incomeEntries={incomeEntries}
          onEdit={(income) => {
            setEditingIncome(income);
            form.reset({
              date: new Date(income.date),
              amount: Number(income.amount),
              source: income.source,
              category: income.category,
              description: income.description || "",
              paymentMethod: income.paymentMethod || "bank_transfer",
            });
            setSelectedDate(new Date(income.date));
          }}
          onDelete={(income) => {
            if (window.confirm(t("common.confirmDelete"))) {
              deleteIncome.mutate(income.id);
            }
          }}
        />
      )}
    </div>
  );
}
