import { TbReceipt } from "react-icons/tb";

interface AffiliateBannerProps {
  className?: string;
}

export default function AffiliateBanner({ className }: AffiliateBannerProps) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">Aanbevolen Boekhoudsoftware</h3>
      <a
        href="https://www.moneybird.nl"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors"
      >
        <TbReceipt className="h-8 w-8" />
        <div>
          <p className="font-medium">Moneybird</p>
          <p className="text-sm text-muted-foreground">
            Online boekhouden voor ondernemers
          </p>
        </div>
      </a>
      {/* Add more affiliate links here */}
    </div>
  );
}