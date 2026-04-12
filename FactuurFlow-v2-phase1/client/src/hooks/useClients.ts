import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi, type Client } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const QUERY_KEY = ["clients"] as const;

export function useClients() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: clientsApi.list,
    staleTime: 30_000,
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => clientsApi.get(id),
    enabled: id > 0,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: clientsApi.create,
    onSuccess: (client) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Klant aangemaakt", description: client.name });
    },
    onError: (err: Error) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) =>
      clientsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Klant bijgewerkt" });
    },
    onError: (err: Error) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Klant verwijderd" });
    },
    onError: (err: Error) => {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    },
  });
}
