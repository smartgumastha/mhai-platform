"use client";

import { useCallback } from "react";
import { useLocale } from "@/app/providers/locale-context";
import { useAuth } from "@/app/providers/auth-context";

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

/**
 * usePaymentGateway — routes checkout to razorpay / stripe / mpesa based
 * on the locale's primary_gateway field (authoritative, from backend).
 * No more currency-code heuristics.
 */
export function usePaymentGateway() {
  var ctx = useLocale();
  var { user } = useAuth();

  var v2 = ctx.localeV2;
  var gateway = (v2 && v2.payment && v2.payment.primary_gateway) || "razorpay";
  var currencyCode = (v2 && v2.currency && v2.currency.code) || "INR";

  var openCheckout = useCallback(
    function (opts: CheckoutOptions) {
      if (gateway === "stripe") {
        console.log("[PaymentGateway] Stripe checkout not yet wired. Currency:", opts.currency);
        opts.onFailure("Stripe payments coming soon for your region. Please contact support.");
        return;
      }

      if (gateway === "mpesa") {
        console.log("[PaymentGateway] M-Pesa checkout not yet wired. Currency:", opts.currency);
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
        key: RAZORPAY_KEY,
        amount: Math.round(opts.amount * 100),
        currency: opts.currency || currencyCode,
        name: (user && (user as any).business_name) || "MHAI Pay",
        description: opts.purpose,
        prefill: {
          name: opts.customerName || "",
          contact: opts.customerPhone || "",
          email: opts.customerEmail || "",
        },
        theme: { color: "#10b981" },
        notes: {
          hospital_id: (user && user.hospital_id) || "",
          purpose: opts.purpose,
        },
        handler: function (response: any) {
          opts.onSuccess(response.razorpay_payment_id, response.razorpay_order_id || "");
        },
        modal: {
          ondismiss: function () {
            opts.onFailure("Payment cancelled");
          },
        },
      };

      var rzp = new Razorpay(options);
      rzp.open();
    },
    [gateway, currencyCode, user]
  );

  return {
    gateway: gateway,
    currency: currencyCode,
    openCheckout: openCheckout,
  };
}
