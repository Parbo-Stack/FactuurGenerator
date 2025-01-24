import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface AdsProps {
  className?: string;
  slot: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

function AdComponent({ className, slot }: AdsProps) {
  useEffect(() => {
    try {
      // Push the ad to AdSense
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
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

export default function Ads(props: AdsProps) {
  return (
    <ErrorBoundary fallback={<div className={props.className} />}>
      <AdComponent {...props} />
    </ErrorBoundary>
  );
}