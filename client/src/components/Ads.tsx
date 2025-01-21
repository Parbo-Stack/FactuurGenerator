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

// Add AdSense script to document head
const addScript = () => {
  const script = document.createElement('script');
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5519222773135571";
  script.async = true;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
};

function AdComponent({ className, slot }: AdsProps) {
  useEffect(() => {
    // Add AdSense script if not already present
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      addScript();
    }

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
        data-ad-client="ca-pub-5519222773135571"
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