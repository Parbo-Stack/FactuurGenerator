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
import { type SelectIncome } from "@db/schema";

interface IncomeListProps {
  incomeEntries: SelectIncome[];
  onEdit: (income: SelectIncome) => void;
  onDelete: (income: SelectIncome) => void;
}

export default function IncomeList({ incomeEntries, onEdit, onDelete }: IncomeListProps) {
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
            <TableHead>{t("income.list.columns.date")}</TableHead>
            <TableHead>{t("income.list.columns.source")}</TableHead>
            <TableHead>{t("income.list.columns.category")}</TableHead>
            <TableHead>{t("income.list.columns.paymentMethod")}</TableHead>
            <TableHead className="text-right">{t("income.list.columns.amount")}</TableHead>
            <TableHead className="w-[100px]">{t("income.list.columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incomeEntries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                {t("income.list.noIncome")}
              </TableCell>
            </TableRow>
          ) : (
            incomeEntries.map((income) => (
              <TableRow key={income.id}>
                <TableCell>{format(new Date(income.date), 'dd-MM-yyyy')}</TableCell>
                <TableCell>{income.source}</TableCell>
                <TableCell>{t(`income.categories.${income.category}`)}</TableCell>
                <TableCell>{income.paymentMethod}</TableCell>
                <TableCell className="text-right">{formatCurrency(Number(income.amount))}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(income)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(income)}
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
