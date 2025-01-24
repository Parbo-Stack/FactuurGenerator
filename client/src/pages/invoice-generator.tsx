import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import InvoiceForm from "@/components/InvoiceForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function InvoiceGenerator() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const toggleLanguage = () => {
    const newLang = i18n.language === "nl" ? "en" : "nl";
    i18n.changeLanguage(newLang);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {t("invoice.title")}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Facturen maken, snel en gratis!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={toggleLanguage}
            >
              {i18n.language === "nl" ? "EN" : "NL"}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <InvoiceForm />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}