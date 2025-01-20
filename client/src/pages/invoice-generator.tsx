import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import InvoiceForm from "@/components/InvoiceForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function InvoiceGenerator() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const toggleLanguage = () => {
    const newLang = i18n.language === "nl" ? "en" : "nl";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("invoice.title")}
          </h1>
          <Button
            variant="outline"
            onClick={toggleLanguage}
            className="ml-4"
          >
            {i18n.language === "nl" ? "EN" : "NL"}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <InvoiceForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
