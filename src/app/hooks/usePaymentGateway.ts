"use client";

import { useCallback } from "react";
import { useDashboard } from "@/app/dashboard/contexts/DashboardContext";
import { useLocale } from "@/app/providers/locale-context";

var RAZORPAY_KEY = "rzp_live_SYv4bpGGvljs1k";

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
  var { locale: dashLocale, hospital } = useDashboard();
  var { locale: localeData } = useLocale();

  // Determine payment gateway from locale
  // razorpay for IN, stripe for US/GB/DE/SG/AU/CA, mpesa for KE
  var paymentMethod = "razorpay";
  var currencyCode = dashLocale.currency_code || localeData.currency_code || "INR";
  if (["USD", "GBP", "EUR", "SGD", "AUD", "CAD"].includes(currencyCode)) {
    paymentMethod = "stripe";
  } else if (currencyCode === "KES") {
    paymentMethod = "mpesa";
  }

  var gateway = paymentMethod;
  var key = RAZORPAY_KEY;

  var openCheckout = useCallback(function (opts: CheckoutOptions) {
    if (gateway === "stripe") {
      console.log("[PaymentGateway] Stripe checkout coming soon. Currency:", opts.currency);
      opts.onFailure("Stripe payments coming soon for your region. Please contact support.");
      return;
    }

    if (gateway === "mpesa") {
      console.log("[PaymentGateway] M-Pesa checkout coming soon. Currency:", opts.currency);
      opts.onFailure("M-Pesa payments coming soon for your region. Please contact support.");
      return;
    }

    // Razorpay (default for IN)
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
  }, [key, hospital, gateway]);

  return { gateway: gateway, key: key, openCheckout: openCheckout };
}
