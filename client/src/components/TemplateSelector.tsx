import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { invoiceTemplates } from "@/lib/invoice-templates";
import { useTranslation } from "react-i18next";

interface TemplateSelectorProps {
  value: string;
  onChange: (templateId: string) => void;
}

export default function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {t("invoice.template.select")}
      </h3>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {invoiceTemplates.map((template) => (
          <div key={template.id} className="relative">
            <RadioGroupItem
              value={template.id}
              id={template.id}
              className="peer sr-only"
            />
            <Label
              htmlFor={template.id}
              className="flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer peer-checked:border-primary hover:bg-accent transition-colors"
            >
              <div className="font-semibold">{template.name}</div>
              <div className="text-sm text-muted-foreground">
                {template.description}
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}