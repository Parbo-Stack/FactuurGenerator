import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { invoiceTemplates } from "@/lib/invoice-templates";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";

interface TemplateSelectorProps {
  value: string;
  onChange: (templateId: string) => void;
}

export default function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const { t } = useTranslation();
  const { setTheme } = useTheme();

  // Update theme when template changes
  useEffect(() => {
    const template = invoiceTemplates.find(t => t.id === value);
    if (template) {
      setTheme(template.theme);
    }
  }, [value, setTheme]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {t("invoice.template.select")}
      </h3>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {invoiceTemplates.map((template) => (
          <div key={template.id}>
            <RadioGroupItem
              value={template.id}
              id={template.id}
              className="peer sr-only"
            />
            <Label
              htmlFor={template.id}
              className="flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer peer-checked:border-primary hover:bg-accent transition-colors"
            >
              <Card className="aspect-[210/297] w-full overflow-hidden">
                <CardContent className="p-2">
                  <img
                    src={template.preview}
                    alt={template.name}
                    className="w-full h-full object-cover rounded"
                  />
                </CardContent>
              </Card>
              <div>
                <div className="font-semibold">{template.name}</div>
                <div className="text-sm text-muted-foreground">
                  {template.description}
                </div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
