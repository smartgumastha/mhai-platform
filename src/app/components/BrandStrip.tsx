"use client";
import { WhatsAppIcon, MetaIcon, InstagramIcon, YouTubeIcon, GoogleIcon, GoogleMapsIcon, RazorpayIcon, StripeIcon } from "./BrandIcons";

const brands = [
  { icon: <WhatsAppIcon size={16} />, name: "WhatsApp", subtitle: "Cloud API", iconLg: <WhatsAppIcon size={28} /> },
  { icon: <MetaIcon size={16} />, name: "Meta", subtitle: "Graph API", iconLg: <MetaIcon size={28} /> },
  { icon: <InstagramIcon size={16} id="bs_ig" />, name: "Instagram", subtitle: "Content API", iconLg: <InstagramIcon size={28} id="bs_ig_lg" /> },
  { icon: <YouTubeIcon size={16} />, name: "YouTube", subtitle: "Data API", iconLg: <YouTubeIcon size={28} /> },
  { icon: <GoogleIcon size={16} />, name: "Google", subtitle: "Business API", iconLg: <GoogleIcon size={28} /> },
  { icon: <GoogleMapsIcon size={16} />, name: "Maps", subtitle: "Places API", iconLg: <GoogleMapsIcon size={28} /> },
  { icon: <RazorpayIcon size={16} />, name: "Razorpay", subtitle: "Payment API", iconLg: <RazorpayIcon size={28} /> },
  { icon: <StripeIcon size={16} />, name: "Stripe", subtitle: "Payment API", iconLg: <StripeIcon size={28} /> },
];

interface Props {
  variant: "hero" | "trust_strip" | "footer";
}

export default function BrandStrip({ variant }: Props) {
  if (variant === "hero") {
    return (
      <div className="mt-8 mb-6">
        <p className="shine-text text-center text-[10px] uppercase tracking-[0.2em] font-semibold mb-3">
          Officially integrates with
        </p>
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 rounded-lg border-t border-b border-white/10 bg-black/25 px-4 py-2.5">
            {brands.map((b) => (
              <div key={b.name} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5">
                {b.icon}
                <span className="text-[10px] text-white/60">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "trust_strip") {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {brands.map((b) => (
          <div key={b.name} className="flex flex-col items-center rounded-xl bg-[#F8FAFC] p-5 border border-gray-100">
            {b.iconLg}
            <p className="mt-2 text-sm font-medium text-gray-800">{b.name}</p>
            <p className="text-[10px] text-gray-400">{b.subtitle}</p>
          </div>
        ))}
      </div>
    );
  }

  // footer
  return (
    <div className="flex justify-center gap-4 opacity-50">
      {brands.map((b) => (
        <span key={b.name} className="grayscale">{b.icon}</span>
      ))}
    </div>
  );
}
