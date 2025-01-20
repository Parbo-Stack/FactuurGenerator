import { useEffect } from "react";

interface AdsProps {
  className?: string;
  slot: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function Ads({ className, slot }: AdsProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("Error loading AdSense:", err);
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-YOUR_CLIENT_ID"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
