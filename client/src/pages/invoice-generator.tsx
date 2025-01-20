import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import InvoiceForm from "@/components/InvoiceForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Ads from "@/components/Ads";

export default function InvoiceGenerator() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const toggleLanguage = () => {
    const newLang = i18n.language === "nl" ? "en" : "nl";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Ad */}
      <div className="w-full max-w-4xl mx-auto pt-4">
        <Ads slot="top-ad" className="min-h-[90px]" />
      </div>

      <div className="flex gap-8 p-8">
        {/* Main Content */}
        <div className="flex-1 max-w-4xl">
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

          {/* Bottom Ad */}
          <div className="mt-8">
            <Ads slot="bottom-ad" className="min-h-[250px]" />
          </div>
        </div>

        {/* Sidebar Ads */}
        <div className="w-80 space-y-6 hidden lg:block">
          <Ads slot="sidebar-top" className="min-h-[300px]" />
          <Ads slot="sidebar-middle" className="min-h-[300px]" />
          <Ads slot="sidebar-bottom" className="min-h-[300px]" />
        </div>
      </div>
    </div>
  );
}