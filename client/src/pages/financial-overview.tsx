import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Euro } from "lucide-react";
import Layout from "@/components/Layout";
import type { SelectInvoice } from "@db/schema";

interface InvoiceStats {
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  overDueAmount: number;
}

export default function FinancialOverview() {
  const { toast } = useToast();

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<SelectInvoice[]>({
    queryKey: ['/api/invoices'],
  });

  if (isLoadingInvoices) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const stats: InvoiceStats = invoices?.reduce(
    (acc, invoice) => {
      const total = Number(invoice.total);
      acc.totalAmount += total;

      if (invoice.status === 'paid' && invoice.paidDate) {
        acc.paidAmount += total;
      } else {
        acc.unpaidAmount += total;
        if (new Date(invoice.dueDate) < new Date()) {
          acc.overDueAmount += total;
        }
      }

      return acc;
    },
    { totalAmount: 0, paidAmount: 0, unpaidAmount: 0, overDueAmount: 0 }
  ) ?? { totalAmount: 0, paidAmount: 0, unpaidAmount: 0, overDueAmount: 0 };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Financial Overview</h1>
          <p className="mt-2 text-muted-foreground">
            Track your invoices, income, and expenses
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total value of all invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">€{stats.paidAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Amount received from paid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">€{stats.unpaidAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Pending payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">€{stats.overDueAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Past due payments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              Overview of your latest invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices?.map(invoice => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(invoice.dueDate), 'PP')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{Number(invoice.total).toFixed(2)}</p>
                    <p className={`text-sm ${
                      invoice.status === 'paid'
                        ? 'text-green-600'
                        : new Date(invoice.dueDate) < new Date()
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
