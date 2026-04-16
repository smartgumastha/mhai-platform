"use client";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const LTV: Record<string, number> = {
  Dentistry: 85000, Dermatology: 42000, Orthopedics: 120000, "IVF/Fertility": 350000,
  Pediatrics: 35000, General: 25000, Cardiology: 150000, Ophthalmology: 55000,
};
const CITY: Record<string, number> = { "Tier 1 Metro": 1.0, "Tier 2": 0.75, "Tier 3": 0.55, International: 2.5 };

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => "\u20B9" + Math.round(v).toLocaleString("en-IN"));

  useEffect(() => { mv.set(value); }, [value, mv]);

  return <motion.span className="gradient-text-hero text-5xl md:text-6xl font-bold">{display}</motion.span>;
}

export default function ROICalculator() {
  const [specialty, setSpecialty] = useState("Dentistry");
  const [city, setCity] = useState("Tier 1 Metro");
  const [current, setCurrent] = useState(15);

  const newPatients = Math.round(current * 1.2);
  const avgValue = Math.round(LTV[specialty] * CITY[city] * 0.31);
  const monthly = newPatients * avgValue;
  const yearly = monthly * 12;
  const roi = Math.round(monthly / 2999);

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-8">
        <div>
          <label className="text-xs font-medium text-gray-500">Specialty</label>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white">
            {Object.keys(LTV).map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">City tier</label>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white">
            {Object.keys(CITY).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Patients/month</label>
          <input type="number" value={current} onChange={(e) => setCurrent(Number(e.target.value) || 1)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-white text-center" min={1} />
        </div>
      </div>

      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Clara adds</p>
      <AnimatedNumber value={monthly} />
      <p className="text-gray-400 text-sm mt-1">per month</p>

      <div className="flex justify-center gap-2 mt-4">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">+{newPatients} patients/mo</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{"\u20B9"}{avgValue.toLocaleString("en-IN")} avg value</span>
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">{roi}x ROI</span>
      </div>

      <p className="mt-4 text-sm text-purple-600 font-medium">
        You&apos;d be earning an extra {"\u20B9"}{(yearly / 100000).toFixed(1)} lakh in the first year
      </p>
    </div>
  );
}
