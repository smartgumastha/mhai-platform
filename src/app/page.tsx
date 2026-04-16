"use client";

import CosmicStage from "./components/CosmicStage";
import BrandStrip from "./components/BrandStrip";
import WeaponCard from "./components/WeaponCard";
import LiveDemoVideo from "./components/LiveDemoVideo";
import ROICalculator from "./components/ROICalculator";
import PlanCard from "./components/PlanCard";
import { WhatsAppIcon, MetaIcon, InstagramIcon, YouTubeIcon, GoogleIcon, ClaudeIcon } from "./components/BrandIcons";
import { motion } from "framer-motion";
import { Layout, MessageCircle, PenTool, Phone, TrendingUp, Target, RotateCcw, Shield, Zap, Sparkles } from "lucide-react";
import Link from "next/link";

/* ── weapon preview snippets ── */
function WebPreview() {
  return (
    <div className="space-y-1 text-[10px]">
      <div className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-emerald-400" /> Home</div>
      <div className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-emerald-400" /> About</div>
      <div className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-emerald-400" /> Services</div>
      <div className="mt-1 flex items-center gap-1 text-emerald-400"><GoogleIcon size={10} /> SEO: 94/100</div>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="space-y-1.5">
      <div className="rounded bg-white/10 px-2 py-1 text-[10px]">Hi, I need an appointment</div>
      <div className="rounded bg-emerald-500/30 px-2 py-1 text-[10px] text-emerald-200">Sure! Dr. Shah has slots tomorrow at 10 AM and 4 PM. Which works?</div>
      <div className="flex gap-1">{[0,1,2].map(i=><span key={i} className="h-1 w-1 rounded-full bg-emerald-400" style={{animation:`typeDots 1.4s infinite ${i*0.2}s`}}/>)}</div>
    </div>
  );
}

function WAPreview() {
  return (
    <div className="space-y-1 text-[10px]" style={{color:"#5DCAA5"}}>
      <div>09:00 \u2022 Appointment reminder</div>
      <div>12:00 \u2022 Post-visit feedback</div>
      <div>18:00 \u2022 EMI payment link</div>
    </div>
  );
}

function ContentPreview() {
  return (
    <div className="text-[10px]">
      <p className="text-white/80 font-medium">5 Signs You Need a Root Canal</p>
      <p className="text-white/40 mt-0.5">1,247 reads \u00B7 <span className="inline-flex items-center gap-0.5">#1 <GoogleIcon size={8} /></span></p>
    </div>
  );
}

function SocialPreview() {
  return (
    <div>
      <div className="flex gap-2 mb-1"><InstagramIcon size={14} id="wc_ig"/> <MetaIcon size={14}/> <YouTubeIcon size={14}/></div>
      <p className="text-[10px] text-white/60">IG +2.4k \u00B7 FB +890 \u00B7 YT +340</p>
    </div>
  );
}

function VoicePreview() {
  return (
    <div className="flex items-center gap-1.5">
      {[12,20,8,18,14,22,10,16].map((h,i)=><div key={i} className="w-1 rounded-full bg-[#D85A30]" style={{height:h,animation:"pulseGlow 1.5s ease-in-out infinite",animationDelay:`${i*0.1}s`}}/>)}
      <span className="text-[10px] text-white/60 ml-1">Namaste, Clara...</span>
    </div>
  );
}

function CoachPreview() {
  return (
    <div className="text-[10px]">
      <div className="flex items-center justify-between"><span className="text-white/70">Priya</span><span className="text-emerald-400 font-bold">91</span></div>
      <div className="h-1.5 rounded-full bg-white/10 mt-1"><div className="h-full rounded-full bg-emerald-400" style={{width:"91%"}}/></div>
    </div>
  );
}

function ScorePreview() {
  return (
    <div className="space-y-1.5 text-[10px]">
      <div><span className="text-white/70">Hot lead</span><div className="h-1.5 rounded-full bg-white/10 mt-0.5"><div className="h-full rounded-full bg-emerald-400" style={{width:"87%"}}/></div></div>
      <div><span className="text-white/70">Cold lead</span><div className="h-1.5 rounded-full bg-white/10 mt-0.5"><div className="h-full rounded-full bg-amber-400" style={{width:"34%"}}/></div></div>
    </div>
  );
}

function ReactivatePreview() {
  return (
    <div className="text-[10px] space-y-0.5">
      <div className="text-white/60">Dormant <span className="text-amber-400 font-bold">847</span></div>
      <div className="text-white/60">Booked <span className="text-emerald-400 font-bold">+\u20B92.8L</span></div>
    </div>
  );
}

function ReputationPreview() {
  return (
    <div className="text-[10px]">
      <div className="flex gap-0.5 mb-0.5">{[1,2,3,4,5].map(i=><span key={i} className="text-amber-400">{"\u2605"}</span>)}</div>
      <span className="text-white/70">4.9 (247) \u00B7 Auto-reply on Google...</span>
    </div>
  );
}

function CompliancePreview() {
  return (
    <div className="flex flex-wrap gap-1">
      {["TRAI","TCPA","GDPR","PECR","PDPA","TDRA"].map(c=><span key={c} className="rounded bg-white/10 px-1 py-0.5 text-[8px] text-white/60">{c}</span>)}
    </div>
  );
}

/* ── plan weapon definitions ── */
const W = {
  web: { name: "Web Designer", gradient: "linear-gradient(135deg, #0F6E56, #5DCAA5)" },
  chat: { name: "Receptionist", gradient: "linear-gradient(135deg, #0C447C, #378ADD)" },
  wa: { name: "WhatsApp", gradient: "linear-gradient(135deg, #128C7E, #25D366)" },
  content: { name: "Content Writer", gradient: "linear-gradient(135deg, #3C3489, #7F77DD)" },
  social: { name: "Social Manager", gradient: "linear-gradient(135deg, #72243E, #D4537E)" },
  rep: { name: "Reputation Guardian", gradient: "linear-gradient(135deg, #1A56B5, #4285F4)" },
  comply: { name: "Compliance Guardian", gradient: "linear-gradient(135deg, #501313, #E24B4A)" },
  voice: { name: "Voice Caller 500min", gradient: "linear-gradient(135deg, #712B13, #D85A30)" },
  score: { name: "Lead Scorer", gradient: "linear-gradient(135deg, #042C53, #378ADD)" },
  react: { name: "Reactivator", gradient: "linear-gradient(135deg, #633806, #EF9F27)" },
  coach: { name: "Sales Coach", gradient: "linear-gradient(135deg, #085041, #5DCAA5)" },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F1117]">
      {/* ═══ ACT 1: HERO ═══ */}
      <CosmicStage className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-white/60">847 clinics launched this month</span>
          </div>

          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles size={14} className="text-[#5DCAA5]" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#5DCAA5] font-medium">Meet Clara</span>
            <Sparkles size={14} className="text-[#AFA9EC]" />
          </div>

          {/* H1 */}
          <h1 className="text-4xl md:text-[56px] font-medium leading-tight text-white mb-6">
            Your clinic&apos;s<br />
            <span className="gradient-text-hero italic">11 new teammates</span><br />
            in one magical assistant
          </h1>

          <p className="text-white/50 max-w-xl mx-auto text-base mb-6">
            Clara writes your website, books patients via WhatsApp, calls leads with AI voice, posts on social media, and coaches your telecallers &mdash; all on autopilot.
          </p>

          <BrandStrip variant="hero" />

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link href="/signup" className="rounded-full px-8 py-3 text-sm font-semibold text-white" style={{ background: "linear-gradient(90deg, #1D9E75, #7F77DD)", animation: "glowRing 2.5s infinite" }} aria-label="Give Clara to my clinic">
              Give Clara to my clinic &rarr;
            </Link>
            <Link href="#demo" className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/70 hover:bg-white/10">
              Watch 47-sec demo
            </Link>
          </div>

          <p className="text-[10px] text-white/30 mt-4">Free 14 days \u00B7 No credit card \u00B7 Cancel anytime</p>
        </div>
      </CosmicStage>

      {/* ═══ ACT 2: LIVE DEMO ═══ */}
      <section id="demo" className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <LiveDemoVideo />
        </div>
      </section>

      {/* ═══ ACT 3: ARSENAL ═══ */}
      <CosmicStage className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <span className="inline-block rounded-full bg-white/10 border border-white/10 px-3 py-1 text-[10px] uppercase tracking-wider text-white/60 mb-4">Clara&apos;s arsenal</span>
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-2">Eleven weapons. One assistant.</h2>
            <p className="gradient-text-hero text-lg">Every weapon, officially integrated.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <WeaponCard number="01" label="Web Designer" title="AI websites that rank #1" accent="#5DCAA5" accentDark="#0F6E56" accentLight="#9FE1CB" icon={<Layout size={13}/>} preview={<WebPreview/>} footer="60s \u00B7 Google SEO \u00B7 Mobile perfect" delay={0}/>
            <WeaponCard number="02" label="Receptionist" title="24/7 AI chatbot" accent="#378ADD" accentDark="#0C447C" accentLight="#B5D4F4" icon={<MessageCircle size={13}/>} preview={<ChatPreview/>} footer="24/7 \u00B7 Web chat \u00B7 70+ languages" delay={1}/>
            <WeaponCard number="03" label="WhatsApp" title="Automated messaging" accent="#25D366" accentDark="#128C7E" accentLight="#9FE1CB" icon={<WhatsAppIcon size={14}/>} preview={<WAPreview/>} footer="WhatsApp Business Cloud API" partnerBadge={{logo:<MetaIcon size={12}/>,label:"Meta \u2713",color:"#5DCAA5"}} delay={2}/>
            <WeaponCard number="04" label="Content Writer" title="SEO blogs that rank" accent="#7F77DD" accentDark="#3C3489" accentLight="#CECBF6" icon={<PenTool size={13}/>} preview={<ContentPreview/>} footer="4 posts/mo \u00B7 Google top rank" partnerBadge={{logo:<GoogleIcon size={12}/>,label:"Google SEO",color:"#B5D4F4"}} delay={3}/>
            <WeaponCard number="05" label="Social Manager" title="Post everywhere" accent="#D4537E" accentDark="#72243E" accentLight="#F4C0D1" icon={<InstagramIcon size={13} id="wc5"/>} preview={<SocialPreview/>} footer="20/mo \u00B7 Meta + YouTube APIs" delay={4}/>
            <WeaponCard number="06" label="Voice Caller" title="AI voice calls" accent="#D85A30" accentDark="#712B13" accentLight="#F5C4B3" icon={<Phone size={13} style={{animation:"float 2s ease-in-out infinite"}}/>} preview={<VoicePreview/>} footer="AI voice \u00B7 Legal \u00B7 70 langs" pulseOrb delay={5}/>
            <WeaponCard number="07" label="Sales Coach" title="Weekly AI coaching" accent="#5DCAA5" accentDark="#085041" accentLight="#9FE1CB" icon={<TrendingUp size={13}/>} preview={<CoachPreview/>} footer="Weekly AI reports \u00B7 Heatmaps" delay={6}/>
            <WeaponCard number="08" label="Lead Scorer" title="AI lead scoring" accent="#378ADD" accentDark="#042C53" accentLight="#B5D4F4" icon={<Target size={13}/>} preview={<ScorePreview/>} footer="0-100 AI \u00B7 Claude scoring" delay={7}/>
            <WeaponCard number="09" label="Reactivator" title="Win back patients" accent="#EF9F27" accentDark="#633806" accentLight="#FAC775" icon={<RotateCcw size={13}/>} preview={<ReactivatePreview/>} footer="WhatsApp re-engagement" partnerBadge={{logo:<WhatsAppIcon size={12}/>,label:"WA \u2713",color:"#5DCAA5"}} delay={8}/>
            <WeaponCard number="10" label="Reputation" title="Google review management" accent="#4285F4" accentDark="#1A56B5" accentLight="#B5D4F4" icon={<GoogleIcon size={14}/>} preview={<ReputationPreview/>} footer="Google Business Profile API" partnerBadge={{logo:<GoogleIcon size={12}/>,label:"GBP \u2713",color:"#85B7EB"}} delay={9}/>
            <WeaponCard number="11" label="Compliance" title="Auto DND + consent" accent="#E24B4A" accentDark="#501313" accentLight="#F7C1C1" icon={<Shield size={13}/>} preview={<CompliancePreview/>} footer="DND \u00B7 Time \u00B7 Consent" delay={10}/>
            {/* ALL ELEVEN card */}
            <WeaponCard number="" label="" title="ALL ELEVEN" accent="#5DCAA5" accentDark="#5DCAA5" accentLight="#AFA9EC" icon={<Zap size={13}/>} gradient
              preview={<div className="text-center"><span className="gradient-text-hero text-2xl font-bold">{"\u20B9"}2,999</span><p className="text-[10px] text-white/50 mt-1">per month</p><span className="inline-block mt-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] text-emerald-300">Save {"\u20B9"}2.9L/mo</span></div>}
              footer="" delay={11}/>
          </div>
        </div>
      </CosmicStage>

      {/* ═══ ACT 4: TECHNOLOGY ═══ */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] text-amber-700 font-semibold mb-4">{"\u2B50"} Trusted integrations</span>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">The technology behind Clara</h2>
          <p className="text-gray-500 max-w-lg mx-auto mb-8">Not fake. Not scraped. Official APIs from the companies billions of people already trust.</p>
          <BrandStrip variant="trust_strip" />

          {/* Claude card */}
          <div className="mt-8 rounded-2xl bg-[#1C1917] p-6 flex flex-col md:flex-row items-center gap-6 text-left">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D97706] shrink-0">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Clara&apos;s brain</p>
              <p className="text-lg font-semibold text-white">Powered by Claude from Anthropic</p>
              <p className="text-sm text-white/50">Same AI used by Fortune 500 companies &mdash; now speaking your clinic&apos;s language.</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-4">All trademarks belong to their respective owners. MHAI integrates via official public APIs.</p>
        </div>
      </section>

      {/* ═══ ACT 5: PRICING ═══ */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-[10px] uppercase tracking-wider text-purple-600 font-semibold">Pick Clara&apos;s powers</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-2">Every plan unlocks more weapons</h2>
          <p className="text-gray-500 mb-10">Start free. Upgrade when Clara earns you more than the cost.</p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <PlanCard name="Starter" subtitle="For new clinics" price={"\u20B9999"} note="" roiNote="" weaponsUnlocked={3}
              weapons={[W.web, W.chat, {...W.wa, name:"WhatsApp 100/mo"}]}
              lockedTeaser="8 more weapons..." ctaText="Start free trial" ctaStyle="outline"/>
            <PlanCard name="Growth" subtitle="Most popular" price={"\u20B92,999"} priceStrike={"\u20B94,999"} note="Launch offer \u00B7 ends Apr 30" roiNote="Avg clinic earns \u20B94.7L/month" weaponsUnlocked={7} featured
              weapons={[W.web, {...W.chat,name:"Receptionist full"}, {...W.wa,name:"WhatsApp unlimited"}, W.content, W.social, W.rep, W.comply]}
              lockedTeaser="4 more weapons in Pro..." ctaText="Start Growth free \u2192" ctaStyle="primary"/>
            <PlanCard name="Pro" subtitle="AI voice + CRM" price={"\u20B94,999"} note="" roiNote="Adds AI voice + CRM" weaponsUnlocked={10}
              weapons={[{name:"Everything in Growth, plus:",gradient:"transparent"}, W.voice, W.score, W.react]}
              lockedTeaser="Sales Coach in Call Center" ctaText="Start Pro free" ctaStyle="outline"/>
            <PlanCard name="Call Center" subtitle="Full arsenal" price={"\u20B99,999"} note="All 11 weapons unlocked" roiNote="" weaponsUnlocked={11} cosmic
              weapons={[{name:"Everything in Pro, plus:",gradient:"transparent"}, W.coach, {...W.voice,name:"Voice 5000min"}, {name:"5 telecaller seats",gradient:W.coach.gradient}]}
              ctaText="Arm full arsenal \u2192" ctaStyle="cosmic"/>
          </div>

          {/* Competitor bar */}
          <div className="mt-8 rounded-xl bg-[#F8FAFC] border border-gray-100 px-6 py-4">
            <p className="text-xs text-gray-500 mb-3">What clinics pay for these tools separately today</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400 line-through">Practo {"\u20B9"}15k</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400 line-through">Runo {"\u20B9"}5k</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400 line-through">Web dev {"\u20B9"}30k</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400 line-through">Social agency {"\u20B9"}12k</span>
              <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{background:"linear-gradient(90deg,#1D9E75,#5DCAA5)"}}>MHAI Growth {"\u20B9"}2,999</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ACT 6: ROI ═══ */}
      <section className="px-6 py-16" style={{background:"linear-gradient(135deg, #E6F1FB 0%, #EEEDFE 50%, #E1F5EE 100%)"}}>
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">The money you leave on the table</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-8">See what Clara earns for clinics like yours</h2>
          <ROICalculator />
        </div>
      </section>

      {/* ═══ ACT 7: TESTIMONIAL ═══ */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr] rounded-2xl border border-gray-100 p-8">
            <div className="text-center md:text-left">
              <div className="mx-auto md:mx-0 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white" style={{background:"linear-gradient(135deg,#378ADD,#7F77DD)"}}>AS</div>
              <p className="mt-3 font-semibold text-gray-900">Dr. Anil Sharma</p>
              <p className="text-xs text-gray-500">Sharma Dental, Hyderabad</p>
              <div className="flex items-center justify-center md:justify-start gap-1 mt-1"><GoogleIcon size={12}/> <span className="text-[10px] text-gray-400">4.9 \u00B7 247 reviews</span></div>
            </div>
            <div>
              <p className="text-gray-600 italic leading-relaxed">
                &ldquo;I fired my social media agency and my telecaller the week MHAI launched. Clara does both better. In 60 days I added 47 new patients worth {"\u20B9"}12.4 lakh. Paying {"\u20B9"}2,999 a month for what used to cost me 80,000? It felt like stealing.&rdquo;
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">+47 patients in 60 days</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">+{"\u20B9"}12.4L new revenue</span>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">-{"\u20B9"}80k monthly costs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ACT 8: FINAL CTA ═══ */}
      <CosmicStage className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[10px] uppercase tracking-wider text-[#5DCAA5] font-semibold">Your decision</span>
          <h2 className="text-3xl md:text-4xl font-medium mt-3 mb-4"><span className="gradient-text-hero">Clara is waiting for her new clinic</span></h2>
          <p className="text-white/50 max-w-xl mx-auto mb-8">
            Your website, chatbot, WhatsApp, social posts, telecaller coach, and AI voice calls &mdash; live in 5 minutes. Free for 14 days. Keep the money Clara earns you.
          </p>
          <Link href="/signup" className="inline-block rounded-full px-10 py-3.5 text-sm font-semibold text-white" style={{background:"linear-gradient(90deg, #1D9E75, #7F77DD)", animation:"glowRing 2.5s infinite"}} aria-label="Give Clara to my clinic">
            Give Clara to my clinic &rarr;
          </Link>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {["No credit card","Cancel anytime","Launch in 5 min","70+ languages","8 countries ready"].map(t=>(
              <span key={t} className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] text-white/50">{"\u2713"} {t}</span>
            ))}
          </div>
        </div>
      </CosmicStage>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#111318] px-6 py-12 border-t border-white/5">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 mb-8">
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Product</p>
              <div className="space-y-2"><Link href="/pricing" className="block text-sm text-white/50 hover:text-white/70">Pricing</Link><Link href="#weapons" className="block text-sm text-white/50 hover:text-white/70">Weapons</Link><Link href="#tech" className="block text-sm text-white/50 hover:text-white/70">Integrations</Link></div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Company</p>
              <div className="space-y-2"><Link href="#" className="block text-sm text-white/50 hover:text-white/70">About</Link><Link href="#" className="block text-sm text-white/50 hover:text-white/70">Contact</Link><Link href="#" className="block text-sm text-white/50 hover:text-white/70">Blog</Link></div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Legal</p>
              <div className="space-y-2"><Link href="#" className="block text-sm text-white/50 hover:text-white/70">Privacy</Link><Link href="#" className="block text-sm text-white/50 hover:text-white/70">Terms</Link><p className="text-[10px] text-white/30">Patent pending (Application 202641047349)</p></div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6">
            <BrandStrip variant="footer" />
            <p className="text-center text-[10px] text-white/30 mt-4">&copy; 2026 MediHost AI Technologies Pvt Ltd &middot; Made with love in Hyderabad</p>
            <p className="text-center text-[10px] text-white/20 mt-1">Clara is powered by Claude &mdash; developed by Anthropic. All other trademarks belong to their respective owners.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
