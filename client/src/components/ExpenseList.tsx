import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { type SelectExpense } from "@db/schema";

interface ExpenseListProps {
  expenses: SelectExpense[];
  onEdit: (expense: SelectExpense) => void;
  onDelete: (expense: SelectExpense) => void;
}

export default function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("expenses.list.columns.date")}</TableHead>
            <TableHead>{t("expenses.list.columns.category")}</TableHead>
            <TableHead>{t("expenses.list.columns.description")}</TableHead>
            <TableHead className="text-right">{t("expenses.list.columns.amount")}</TableHead>
            <TableHead>{t("expenses.list.columns.taxDeductible")}</TableHead>
            <TableHead className="w-[100px]">{t("expenses.list.columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                {t("expenses.list.noExpenses")}
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), 'dd-MM-yyyy')}</TableCell>
                <TableCell>{t(`expenses.categories.${expense.category}`)}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(expense.amount))}</TableCell>
                <TableCell>
                  {expense.taxDeductible ? 
                    <span className="text-green-600">✓</span> : 
                    <span className="text-red-600">✗</span>
                  }
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(expense)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(expense)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
