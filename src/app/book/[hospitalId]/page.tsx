"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DashboardProvider } from "@/app/dashboard/contexts/DashboardContext";
import { NotificationProvider } from "@/app/providers/NotificationProvider";
import BookingWidget from "@/app/components/BookingWidget";
import ChatbotWidget from "@/app/components/ChatbotWidget";

var BACKEND = "https://smartgumastha-backend-production.up.railway.app";

type ClinicInfo = {
  name: string;
  city: string;
  address: string;
  phone: string;
  doctor: string;
  clinic_lat?: string;
  clinic_lng?: string;
};

function BookingPageInner({ hospitalId }: { hospitalId: string }) {
  var [clinic, setClinic] = useState<ClinicInfo | null>(null);
  var [loading, setLoading] = useState(true);
  var [notFound, setNotFound] = useState(false);

  useEffect(function () {
    fetch(BACKEND + "/api/public/book-appointment/clinic/" + encodeURIComponent(hospitalId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.clinic) {
          setClinic(data.clinic);
        } else {
          setNotFound(true);
        }
      })
      .catch(function () { setNotFound(true); })
      .finally(function () { setLoading(false); });
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="mb-2 text-lg font-semibold text-gray-900">Clinic not found</div>
        <p className="text-sm text-gray-500">The booking link may be invalid or the clinic is not registered.</p>
      </div>
    );
  }

  var clinicName = clinic?.name || undefined;
  var clinicAddress = [clinic?.address, clinic?.city].filter(Boolean).join(", ") || undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-lg">
          <div className="text-[15px] font-semibold text-gray-900">{clinicName || "Book appointment"}</div>
          {clinicAddress && <div className="text-[11px] text-gray-500">{clinicAddress}</div>}
        </div>
      </div>

      {/* Widget */}
      <div className="mx-auto max-w-lg px-4 py-6">
        <BookingWidget
          hospitalId={hospitalId}
          clinicName={clinicName}
          clinicAddress={clinicAddress}
        />
      </div>

      {/* Find us — Google Map */}
      {clinic?.clinic_lat && clinic?.clinic_lng && (
        <div className="mx-auto max-w-lg px-4 pb-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium text-gray-900">Find us</div>
            <div className="overflow-hidden rounded-xl">
              <iframe
                src={`https://maps.google.com/maps?q=${clinic.clinic_lat},${clinic.clinic_lng}&z=15&output=embed`}
                className="h-[250px] w-full border-0"
                loading="lazy"
                title="Clinic location"
              />
            </div>
            <div className="mt-3">
              <div className="text-[13px] font-medium text-gray-900">{clinicName}</div>
              {clinicAddress && <div className="mt-0.5 text-[11px] text-gray-500">{clinicAddress}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 bg-white px-6 py-3 text-center">
        <span className="text-[10px] text-gray-400">Powered by MediHost AI</span>
      </div>

      {/* Chatbot */}
      <ChatbotWidget hospitalId={hospitalId} clinicName={clinicName} />
    </div>
  );
}

export default function PublicBookingPage() {
  var params = useParams();
  var hospitalId = typeof params.hospitalId === "string" ? params.hospitalId : "";

  if (!hospitalId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Invalid booking link</div>
      </div>
    );
  }

  return (
    <DashboardProvider>
      <NotificationProvider>
        <BookingPageInner hospitalId={hospitalId} />
      </NotificationProvider>
    </DashboardProvider>
  );
}
