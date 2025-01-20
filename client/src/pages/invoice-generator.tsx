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
      {/* Header Ad */}
      <div className="w-full max-w-4xl mx-auto pt-4">
        <Ads slot="header-banner" className="min-h-[90px]" />
      </div>

      <div className="flex gap-8 p-8">
        {/* Left Sidebar Ads */}
        <div className="w-64 space-y-6 hidden xl:block">
          <Ads slot="left-sidebar-top" className="min-h-[600px]" />
          <Ads slot="left-sidebar-bottom" className="min-h-[300px]" />
        </div>

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

          {/* In-content Ad */}
          <div className="mb-8">
            <Ads slot="content-top" className="min-h-[250px]" />
          </div>

          <Card>
            <CardContent className="pt-6">
              <InvoiceForm />
            </CardContent>
          </Card>

          {/* Bottom Ads */}
          <div className="mt-8 space-y-6">
            <Ads slot="content-bottom" className="min-h-[250px]" />
            <Ads slot="footer-banner" className="min-h-[90px]" />
          </div>
        </div>

        {/* Right Sidebar Ads */}
        <div className="w-64 space-y-6 hidden lg:block">
          <Ads slot="right-sidebar-top" className="min-h-[600px]" />
          <Ads slot="right-sidebar-middle" className="min-h-[300px]" />
          <Ads slot="right-sidebar-bottom" className="min-h-[300px]" />
        </div>
      </div>

      {/* Mobile Bottom Ad */}
      <div className="lg:hidden mt-8">
        <Ads slot="mobile-bottom" className="min-h-[250px]" />
      </div>
    </div>
  );
}