import { isUnlimited } from "@/lib/tiers";

interface Props {
  label: string;
  current: number;
  limit: number;
}

export function UsageBar({ label, current, limit }: Props) {
  if (isUnlimited(limit)) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 font-medium">{label}</span>
          <span className="text-green-600 font-semibold">Unlimited</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-full bg-green-200 rounded-full" />
        </div>
      </div>
    );
  }

  const pct = Math.min((current / limit) * 100, 100);
  const barColor =
    pct >= 90 ? "bg-red-500" :
    pct >= 70 ? "bg-amber-400" :
    "bg-green-500";
  const textColor =
    pct >= 90 ? "text-red-600" :
    pct >= 70 ? "text-amber-600" :
    "text-gray-500";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className={`font-semibold ${textColor}`}>{current} / {limit}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
