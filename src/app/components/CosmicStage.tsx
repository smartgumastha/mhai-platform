"use client";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  orbs?: boolean;
}

export default function CosmicStage({ children, className = "", orbs = true }: Props) {
  return (
    <div className={`cosmic-bg rounded-2xl relative overflow-hidden ${className}`}>
      {orbs && (
        <>
          <div className="absolute top-5 left-8 w-36 h-36 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(93, 202, 165, 0.4) 0%, transparent 70%)", filter: "blur(28px)" }} />
          <div className="absolute top-12 right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(175, 169, 236, 0.35) 0%, transparent 70%)", filter: "blur(28px)" }} />
          <div className="absolute bottom-10 left-1/2 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(56, 138, 221, 0.25) 0%, transparent 70%)", filter: "blur(32px)" }} />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
