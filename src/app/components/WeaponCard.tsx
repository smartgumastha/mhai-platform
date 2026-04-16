"use client";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PartnerBadge {
  logo: ReactNode;
  label: string;
  color: string;
}

interface Props {
  number: string;
  label: string;
  title: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  icon: ReactNode;
  preview: ReactNode;
  footer: string;
  partnerBadge?: PartnerBadge;
  pulseOrb?: boolean;
  delay?: number;
  gradient?: boolean;
}

export default function WeaponCard({
  number, label, title, accent, accentLight, accentDark,
  icon, preview, footer, partnerBadge, pulseOrb, delay = 0, gradient,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-xl p-3"
      style={{
        background: gradient
          ? "linear-gradient(135deg, rgba(93,202,165,0.2), rgba(175,169,236,0.2))"
          : "rgba(255,255,255,0.04)",
        border: gradient
          ? "1px solid rgba(93,202,165,0.5)"
          : `0.5px solid ${accentLight}30`,
        minHeight: 170,
        animation: gradient || pulseOrb ? "glowRing 3s infinite" : undefined,
      }}
    >
      {/* Orb */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accent}60 0%, transparent 70%)`,
          filter: "blur(24px)",
          animation: pulseOrb ? "pulseGlow 2s ease-in-out infinite" : "pulseGlow 3s ease-in-out infinite",
        }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg text-white"
            style={{ background: `linear-gradient(135deg, ${accentDark}, ${accent})` }}
          >
            {icon}
          </div>
          <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: accentLight }}>
            {number} {label}
          </span>
        </div>
        {partnerBadge && (
          <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: `${partnerBadge.color}20`, border: `1px solid ${partnerBadge.color}40` }}>
            <span className="scale-75">{partnerBadge.logo}</span>
            <span className="text-[9px] font-medium" style={{ color: partnerBadge.color }}>{partnerBadge.label}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-white mb-2 relative z-10">{title}</p>

      {/* Preview */}
      <div className="rounded-lg bg-black/30 p-2.5 mb-2 relative z-10 text-[10px] text-white/70">
        {preview}
      </div>

      {/* Footer */}
      <p className="text-[9px] italic relative z-10" style={{ color: "rgba(255,255,255,0.5)" }}>{footer}</p>
    </motion.div>
  );
}
