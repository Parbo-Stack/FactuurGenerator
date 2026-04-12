import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, type CreateInvoicePayload, type InvoiceStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const QUERY_KEY = ["invoices"] as const;

export function useInvoices() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: invoicesApi.list,
    staleTime: 30_000,
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => invoicesApi.get(id),
    enabled: id > 0,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateInvoicePayload) => invoicesApi.create(data),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Factuur aangemaakt", description: inv.invoiceNumber });
    },
    onError: (err: Error) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateInvoicePayload> }) =>
      invoicesApi.update(id, data),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, inv.id] });
      toast({ title: "Factuur bijgewerkt" });
    },
    onError: (err: Error) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const statusLabels: Record<InvoiceStatus, string> = {
    draft: "Concept",
    sent: "Verzonden",
    paid: "Betaald",
    overdue: "Te laat",
  };

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: InvoiceStatus }) =>
      invoicesApi.updateStatus(id, status),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: `Status → ${statusLabels[inv.status]}` });
    },
    onError: (err: Error) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: invoicesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Factuur verwijderd" });
    },
    onError: (err: Error) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });
}
