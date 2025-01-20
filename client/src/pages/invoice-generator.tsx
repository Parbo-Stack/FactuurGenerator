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
      {/* Top Banner Ad */}
      <div className="w-full max-w-6xl mx-auto pt-4 px-4">
        <Ads slot="header-banner" className="min-h-[90px] bg-white rounded-lg shadow-sm" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 justify-center">
          {/* Left Sidebar Ads */}
          <div className="hidden lg:flex lg:w-64 flex-col gap-6">
            <Ads slot="left-sidebar-top" className="min-h-[600px] bg-white rounded-lg shadow-sm" />
            <Ads slot="left-sidebar-bottom" className="min-h-[300px] bg-white rounded-lg shadow-sm" />
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-3xl">
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

            {/* In-content Top Ad */}
            <div className="mb-8">
              <Ads slot="content-top" className="min-h-[250px] bg-white rounded-lg shadow-sm" />
            </div>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <InvoiceForm />
              </CardContent>
            </Card>

            {/* Bottom Ads */}
            <div className="mt-8 space-y-6">
              <Ads slot="content-bottom" className="min-h-[250px] bg-white rounded-lg shadow-sm" />
              <Ads slot="footer-banner" className="min-h-[90px] bg-white rounded-lg shadow-sm" />
            </div>
          </div>

          {/* Right Sidebar Ads */}
          <div className="hidden lg:flex lg:w-64 flex-col gap-6">
            <Ads slot="right-sidebar-top" className="min-h-[600px] bg-white rounded-lg shadow-sm" />
            <Ads slot="right-sidebar-middle" className="min-h-[300px] bg-white rounded-lg shadow-sm" />
            <Ads slot="right-sidebar-bottom" className="min-h-[300px] bg-white rounded-lg shadow-sm" />
          </div>
        </div>

        {/* Mobile Bottom Ad */}
        <div className="lg:hidden mt-8">
          <Ads slot="mobile-bottom" className="min-h-[250px] bg-white rounded-lg shadow-sm" />
        </div>
      </div>
    </div>
  );
}