"use client";

import { useCallback } from "react";
import { useDashboard } from "@/app/dashboard/contexts/DashboardContext";

var RAZORPAY_KEY = "rzp_live_SYv4bpGGvljs1k";

// Future: Stripe integration
// For US/UK/EU, switch to Stripe based on locale.country
// var STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_KEY || "";

type CheckoutOptions = {
  amount: number;
  currency: string;
  purpose: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  onSuccess: (paymentId: string, orderId: string) => void;
  onFailure: (error: string) => void;
};

export function usePaymentGateway() {
  var { locale, hospital } = useDashboard();

  // For now all countries use Razorpay
  // Future: if (["US","GB","DE","SG"].includes(locale.country)) return stripeGateway;
  var gateway = "razorpay";
  var key = RAZORPAY_KEY;

  var openCheckout = useCallback(function (opts: CheckoutOptions) {
    var Razorpay = (window as any).Razorpay;
    if (!Razorpay) {
      opts.onFailure("Razorpay checkout script not loaded. Please refresh the page.");
      return;
    }

    var options = {
      key: key,
      amount: Math.round(opts.amount * 100),
      currency: opts.currency || "INR",
      name: hospital.business_name || "MHAI Pay",
      description: opts.purpose,
      prefill: {
        name: opts.customerName || "",
        contact: opts.customerPhone || "",
        email: opts.customerEmail || "",
      },
      notes: {
        hospital_id: hospital.hospital_id || "",
        purpose: opts.purpose,
      },
      handler: function (response: any) {
        opts.onSuccess(
          response.razorpay_payment_id || "",
          response.razorpay_order_id || ""
        );
      },
      modal: {
        ondismiss: function () {
          opts.onFailure("Payment cancelled");
        },
      },
      theme: {
        color: "#059669",
      },
    };

    try {
      var rzp = new Razorpay(options);
      rzp.open();
    } catch (err: any) {
      opts.onFailure(err.message || "Failed to open payment gateway");
    }
  }, [key, hospital]);

  return { gateway: gateway, key: key, openCheckout: openCheckout };
}
