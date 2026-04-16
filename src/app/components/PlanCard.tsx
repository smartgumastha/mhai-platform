"use client";

interface Weapon {
  name: string;
  gradient: string;
  locked?: boolean;
}

interface Props {
  name: string;
  subtitle: string;
  price: string;
  priceStrike?: string;
  note: string;
  roiNote: string;
  weaponsUnlocked: number;
  weapons: Weapon[];
  lockedTeaser?: string;
  featured?: boolean;
  cosmic?: boolean;
  ctaText: string;
  ctaStyle: "outline" | "primary" | "cosmic";
}

export default function PlanCard({
  name, subtitle, price, priceStrike, note, roiNote,
  weaponsUnlocked, weapons, lockedTeaser, featured, cosmic,
  ctaText, ctaStyle,
}: Props) {
  const cardClass = cosmic
    ? "cosmic-bg text-white border border-white/10"
    : featured
      ? "bg-white border-2 border-[#1D9E75]"
      : "bg-white border border-gray-200";

  const textMain = cosmic ? "text-white" : "text-gray-900";
  const textSub = cosmic ? "text-white/60" : "text-gray-500";

  return (
    <div className={`relative rounded-2xl p-5 flex flex-col ${cardClass}`}>
      {/* Featured badge */}
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-bold text-white"
          style={{ background: "linear-gradient(90deg, #1D9E75, #5DCAA5)" }}>
          MOST CHOSEN
        </div>
      )}

      {/* Header */}
      <p className={`text-lg font-bold ${textMain}`}>{name}</p>
      <p className={`text-xs ${textSub} mb-3`}>{subtitle}</p>

      {/* Price */}
      <div className="mb-1">
        {priceStrike && <span className={`line-through text-sm ${textSub} mr-2`}>{priceStrike}</span>}
        <span className={cosmic ? "gradient-text-hero text-3xl font-bold" : `text-3xl font-bold ${textMain}`}>{price}</span>
        <span className={`text-xs ${textSub}`}>/month</span>
      </div>
      {note && <p className="text-[10px] text-emerald-600 font-medium mb-1">{note}</p>}
      {roiNote && <p className={`text-[10px] ${textSub} mb-4`}>{roiNote}</p>}

      {/* Weapons */}
      <p className={`text-[10px] uppercase tracking-wider ${textSub} font-medium mb-2`}>
        {weaponsUnlocked} weapons unlocked
      </p>
      <div className="space-y-1.5 mb-4 flex-1">
        {weapons.map((w) => (
          <div key={w.name} className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded shrink-0" style={{ background: w.gradient, opacity: w.locked ? 0.3 : 1 }} />
            <span className={`text-xs ${w.locked ? "line-through opacity-40" : ""} ${cosmic ? "text-white/80" : "text-gray-700"}`}>
              {w.name}
            </span>
          </div>
        ))}
      </div>
      {lockedTeaser && <p className={`text-[10px] ${textSub} mb-4`}>{lockedTeaser}</p>}

      {/* CTA */}
      <a
        href="/signup"
        className={`block text-center rounded-xl py-2.5 text-sm font-semibold transition ${
          ctaStyle === "cosmic"
            ? "text-white"
            : ctaStyle === "primary"
              ? "text-white"
              : cosmic
                ? "border border-white/30 text-white hover:bg-white/10"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
        style={
          ctaStyle === "cosmic"
            ? { background: "linear-gradient(90deg, #5DCAA5, #7F77DD)" }
            : ctaStyle === "primary"
              ? { background: "linear-gradient(90deg, #1D9E75, #5DCAA5)" }
              : undefined
        }
        aria-label={ctaText}
      >
        {ctaText}
      </a>
    </div>
  );
}
