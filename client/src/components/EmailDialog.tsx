import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InvoiceData, generatePDF } from "@/lib/invoice";

interface EmailDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceData: InvoiceData;
}

export default function EmailDialog({ open, onClose, invoiceData }: EmailDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      // Generate PDF
      const doc = generatePDF(invoiceData);
      const pdfDataUri = doc.output('datauristring');
      const base64Data = pdfDataUri.split(',')[1];

      // Send email
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          invoiceNumber: invoiceData.invoiceNumber,
          pdfBase64: base64Data,
          name: invoiceData.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast({
        title: t('common.success'),
        description: t('invoice.emailSent'),
      });
      onClose();
    } catch (error) {
      console.error('Email error:', error);
      toast({
        title: t('common.error'),
        description: t('invoice.emailError'),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('invoice.email.title')}</DialogTitle>
          <DialogDescription>
            {t('invoice.email.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t('invoice.email.recipient')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? t('invoice.email.sending') : t('invoice.email.send')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}