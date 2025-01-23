import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Calendar as CalendarIcon, Filter, Search } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ExpenseList from "@/components/ExpenseList";
import type { SelectExpense } from "@db/schema";

interface ExpenseFormData {
  date: Date;
  amount: number;
  category: string;
  description: string;
  taxDeductible: boolean;
  attachments: File[];
}

interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export default function ExpensesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SelectExpense | null>(null);

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

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['/api/expenses', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      const response = await fetch(`/api/expenses?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      return response.json();
    },
  });

  // Create expense mutation
  const createExpense = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create expense');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: t("common.success"),
        description: t("expenses.messages.saved"),
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("expenses.messages.error"),
        variant: "destructive",
      });
    },
  });

  // Update expense mutation
  const updateExpense = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ExpenseFormData }) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update expense');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: t("common.success"),
        description: t("expenses.messages.saved"),
      });
      setEditingExpense(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("expenses.messages.error"),
        variant: "destructive",
      });
    },
  });

  // Delete expense mutation
  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: t("common.success"),
        description: t("expenses.messages.deleted"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("expenses.messages.error"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, data });
    } else {
      createExpense.mutate(data);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{editingExpense ? t("expenses.edit") : t("expenses.add")}</CardTitle>
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
              {editingExpense && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingExpense(null);
                    form.reset();
                  }}
                >
                  {t("common.cancel")}
                </Button>
              )}
              <Button type="submit">
                {editingExpense ? t("common.save") : t("expenses.form.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("expenses.list.title")}</h2>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {t("expenses.list.filter")}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t("expenses.list.columns.date")}</Label>
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
                <Label>{t("expenses.list.columns.category")}</Label>
                <Select onValueChange={(value) => setFilters(f => ({ ...f, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
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
                <Label>{t("expenses.list.search")}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("expenses.list.search")}
                    className="pl-8"
                    onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ExpenseList
          expenses={expenses}
          onEdit={(expense) => {
            setEditingExpense(expense);
            form.reset({
              date: new Date(expense.date),
              amount: Number(expense.amount),
              category: expense.category,
              description: expense.description || "",
              taxDeductible: expense.taxDeductible === null ? false : expense.taxDeductible,
              attachments: [],
            });
            setSelectedDate(new Date(expense.date));
          }}
          onDelete={(expense) => {
            if (window.confirm(t("common.confirmDelete"))) {
              deleteExpense.mutate(expense.id);
            }
          }}
        />
      )}
    </div>
  );
}