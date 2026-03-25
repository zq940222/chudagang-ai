"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function StripeConnectButton() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to connect Stripe:", error);
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={loading}>
      {loading ? "Connecting..." : "Connect Stripe"}
    </Button>
  );
}
