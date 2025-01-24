import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro } from "lucide-react";
import { format } from "date-fns";
import Layout from "@/components/Layout";

// Mock data types
interface Invoice {
  id: number;
  invoiceNumber: string;
  total: number;
  status: 'paid' | 'unpaid' | 'overdue';
  dueDate: string;
}

interface InvoiceStats {
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  overDueAmount: number;
}

// Mock data
const mockInvoices: Invoice[] = [
  { id: 1, invoiceNumber: "INV-001", total: 1500, status: 'paid', dueDate: '2025-01-15' },
  { id: 2, invoiceNumber: "INV-002", total: 2300, status: 'unpaid', dueDate: '2025-02-01' },
  { id: 3, invoiceNumber: "INV-003", total: 800, status: 'overdue', dueDate: '2024-12-25' },
  { id: 4, invoiceNumber: "INV-004", total: 1200, status: 'paid', dueDate: '2025-01-20' },
];

export default function FinancialOverview() {
  // Calculate stats from mock data
  const stats: InvoiceStats = mockInvoices.reduce(
    (acc, invoice) => {
      acc.totalAmount += invoice.total;

      if (invoice.status === 'paid') {
        acc.paidAmount += invoice.total;
      } else {
        acc.unpaidAmount += invoice.total;
        if (invoice.status === 'overdue') {
          acc.overDueAmount += invoice.total;
        }
      }

      return acc;
    },
    { totalAmount: 0, paidAmount: 0, unpaidAmount: 0, overDueAmount: 0 }
  );

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
              {mockInvoices.map(invoice => (
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
                    <p className="font-medium">€{invoice.total.toFixed(2)}</p>
                    <p className={`text-sm ${
                      invoice.status === 'paid'
                        ? 'text-green-600'
                        : invoice.status === 'overdue'
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