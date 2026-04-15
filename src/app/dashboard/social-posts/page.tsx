"use client";

import { useState, useEffect } from "react";
import {
  getSocialPosts,
  createSocialPost,
  generateSocialPost,
} from "@/lib/api";

/* ── platform definitions ── */
var platformDefs = [
  { id: "ig", label: "Ig", bg: "bg-gradient-to-br from-[#f09433] to-[#bc1888]" },
  { id: "fb", label: "Fb", bg: "bg-[#1877F2]" },
  { id: "gbp", label: "G", bg: "bg-[#4285F4]" },
  { id: "in", label: "in", bg: "bg-[#0A66C2]" },
];

/* ── tabs ── */
var contentTabs = [
  { id: "posts", label: "Posts" },
  { id: "reels", label: "Reels", coming: true, desc: "AI-generated short-form video from your photos, scripts, or text prompts. Auto-formatted for Instagram Reels, YouTube Shorts, and Facebook." },
  { id: "blog", label: "Blog", coming: true, desc: "SEO-optimized blog articles generated from your expertise, patient FAQs, and health topics. Published directly to your MHAI website." },
  { id: "pr", label: "PR", coming: true, desc: "Press releases, news pitches, and media outreach drafts. AI writes, you review and send to local health journalists and publications." },
];

/* ── calendar data ── */
type CalDay = { d: number; dot?: string; today?: boolean; muted?: boolean };
var calRows: CalDay[][] = [
  [{ d: 0 }, { d: 0 }, { d: 1 }, { d: 2, dot: "#E4405F" }, { d: 3 }, { d: 4, dot: "#1877F2" }, { d: 5 }],
  [{ d: 6 }, { d: 7, dot: "#10b981" }, { d: 8 }, { d: 9, dot: "#E4405F" }, { d: 10 }, { d: 11, dot: "#FF0000" }, { d: 12 }],
  [{ d: 13 }, { d: 14, dot: "#10b981", today: true }, { d: 15 }, { d: 16, dot: "#E4405F" }, { d: 17, dot: "#dc2626" }, { d: 18 }, { d: 19 }],
  [{ d: 20 }, { d: 21, dot: "#1877F2" }, { d: 22 }, { d: 23, dot: "#E4405F" }, { d: 24 }, { d: 25, dot: "#0A66C2" }, { d: 26 }],
  [{ d: 27 }, { d: 28 }, { d: 29 }, { d: 30, dot: "#E4405F" }, { d: 1, muted: true }, { d: 2, muted: true }, { d: 3, muted: true }],
];

/* ── post type → gradient map ── */
var POST_GRADIENTS: Record<string, string> = {
  health_day: "linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)",
  education: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
  milestone: "linear-gradient(135deg, #f59e0b 0%, #78350f 100%)",
  video: "linear-gradient(135deg, #0f0f1a 0%, #1e1e3a 100%)",
  offer: "linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)",
  default: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
};

var POST_TYPE_LABELS: Record<string, string> = {
  health_day: "Health day",
  education: "Educational",
  milestone: "From HMS data",
  video: "Video script",
  offer: "Seasonal offer",
};

/* ── post type options for create flow ── */
var postTypeOptions = [
  { value: "health_day", label: "Health day" },
  { value: "education", label: "Patient education" },
  { value: "milestone", label: "Milestone" },
  { value: "offer", label: "Seasonal offer" },
  { value: "general", label: "General" },
];

function PlatformToggles({ active, onToggle }: { active: string[]; onToggle: (plat: string) => void }) {
  var count = active.length;
  return (
    <div className="mb-3 flex items-center gap-2">
      {platformDefs.map((p) => {
        var on = active.includes(p.id);
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[9px] font-medium transition-all duration-200 ${
              on ? `${p.bg} text-white shadow-sm ring-2 ring-offset-1 ring-gray-300` : "bg-gray-100 text-gray-400"
            }`}
          >
            {p.label}
          </button>
        );
      })}
      <span className="ml-1 text-[9px] text-gray-400">{count === platformDefs.length ? "All platforms" : `${count} platform${count !== 1 ? "s" : ""}`}</span>
    </div>
  );
}

type Post = {
  id: string;
  post_type: string;
  content: string;
  hashtags: string;
  platforms: string[];
  ai_insight?: string;
  title?: string;
  subtitle?: string;
  status?: string;
};

export default function SocialPostsPage() {
  var [activeTab, setActiveTab] = useState("posts");
  var [posts, setPosts] = useState<Post[]>([]);
  var [loading, setLoading] = useState(true);
  var [postPlatforms, setPostPlatforms] = useState<Record<string, string[]>>({});

  /* ── create post state ── */
  var [showCreate, setShowCreate] = useState(false);
  var [newType, setNewType] = useState("general");
  var [newContent, setNewContent] = useState("");
  var [newHashtags, setNewHashtags] = useState("");
  var [newPlatforms, setNewPlatforms] = useState<string[]>(["ig", "fb"]);
  var [aiGenerating, setAiGenerating] = useState(false);
  var [posting, setPosting] = useState(false);

  /* ── fetch posts ── */
  useEffect(() => {
    getSocialPosts()
      .then((res) => {
        if (res.success && res.posts && res.posts.length > 0) {
          setPosts(res.posts);
          var platMap: Record<string, string[]> = {};
          res.posts.forEach((p: any) => {
            platMap[p.id] = p.platforms || ["ig", "fb"];
          });
          setPostPlatforms(platMap);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function togglePostPlatform(postId: string, plat: string) {
    setPostPlatforms((prev) => {
      var list = prev[postId] || [];
      return { ...prev, [postId]: list.includes(plat) ? list.filter((x) => x !== plat) : [...list, plat] };
    });
  }

  function getActiveNames(postId: string) {
    return (postPlatforms[postId] || []).map((id) => platformDefs.find((p) => p.id === id)?.label).filter(Boolean).join(", ");
  }

  /* ── AI generate ── */
  async function handleAiGenerate() {
    setAiGenerating(true);
    try {
      var res = await generateSocialPost({
        specialty: "Physiotherapy",
        topic: newType,
        platform: newPlatforms[0] || "ig",
      });
      if (res.success) {
        if (res.content) setNewContent(res.content);
        if (res.hashtags) setNewHashtags(res.hashtags);
        if (res.caption) setNewContent(res.caption);
      } else {
        alert(res.error || res.message || "AI generation failed");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  }

  /* ── create post ── */
  async function handleCreatePost() {
    if (!newContent.trim()) {
      alert("Please add some content first.");
      return;
    }
    setPosting(true);
    try {
      var res = await createSocialPost({
        post_type: newType,
        content: newContent,
        platforms: newPlatforms,
        hashtags: newHashtags,
      });
      if (res.success) {
        alert("Post created!");
        setShowCreate(false);
        setNewContent("");
        setNewHashtags("");
        setNewType("general");
        setNewPlatforms(["ig", "fb"]);
        if (res.post) {
          setPosts((prev) => [res.post!, ...prev]);
          setPostPlatforms((prev) => ({
            ...prev,
            [res.post!.id]: res.post!.platforms || ["ig", "fb"],
          }));
        }
      } else {
        alert(res.error || res.message || "Failed to create post.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  function resetCreate() {
    setShowCreate(false);
    setNewContent("");
    setNewHashtags("");
    setNewType("general");
    setNewPlatforms(["ig", "fb"]);
  }

  var inputClass =
    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div className="px-8 py-6">
      {/* SECTION 1: Performance pulse */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div><div className="text-[10px] text-gray-400">Yesterday</div><div className="text-sm font-semibold text-gray-900">342 reach</div></div>
          <div className="text-sm font-semibold text-gray-900">18 likes</div>
          <div className="flex items-center gap-1"><span className="text-sm font-semibold text-emerald-600">1 booking</span><span className="text-[11px] text-gray-400">(Rs 600)</span></div>
          <div className="h-6 w-px bg-gray-200" />
          <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">5-day posting streak</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-600">Top 20% of physio clinics on MHAI</span>
          <span className="text-[11px] text-gray-500">18 posts · 4.2K reach · 7 bookings</span>
        </div>
      </div>

      {/* SECTION 2: Header + action bar */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Content Studio</h1>
          <p className="mt-1 text-sm text-gray-500">AI creates, you approve. 30 seconds. Done.</p>
        </div>
        <div className="flex gap-2">
          <button className="cursor-pointer rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2.5 text-xs font-medium text-white shadow-md transition-all duration-200 hover:shadow-lg">Capture moment</button>
          <button className="cursor-pointer rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-medium text-white shadow-md transition-all duration-200 hover:bg-gray-800">Create reel from text</button>
          <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400">WhatsApp import</button>
          <button onClick={() => setShowCreate(true)} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-medium text-white shadow-md transition-all duration-200 hover:bg-emerald-600">+ Create post</button>
        </div>
      </div>

      {/* SECTION 3: Smart suggestions */}
      <div className="mb-4 flex gap-3 overflow-x-auto">
        {[
          { accent: "border-l-blue-500", iconBg: "bg-blue-50", iconColor: "text-blue-500", icon: "\u25B6", text: "Post a doctor intro video \u2014 clinics with video get 35% more bookings" },
          { accent: "border-l-red-500", iconBg: "bg-red-50", iconColor: "text-red-500", icon: "\uD83D\uDCC5", text: "World Hypertension Day in 3 days \u2014 your post is ready, preview?" },
          { accent: "border-l-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-500", icon: "\u2191", text: "Your before/after post got 4x more saves \u2014 post more of these!" },
        ].map((s, i) => (
          <div key={i} className={`flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-xl border border-gray-100 border-l-[3px] bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${s.accent}`} style={{ maxWidth: 280 }}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${s.iconBg} ${s.iconColor}`}>{s.icon}</div>
            <div className="flex-1 text-[11px] leading-snug text-gray-700">{s.text}</div>
            <span className="text-gray-300">&rarr;</span>
          </div>
        ))}
      </div>

      {/* SECTION 4: Tabs */}
      <div className="mb-4 flex gap-0 border-b border-gray-100">
        {contentTabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`cursor-pointer pb-2 pr-5 text-sm transition-all duration-200 ${activeTab === t.id ? "border-b-2 border-emerald-500 font-medium text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
            {t.label}
            {t.coming && <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">Coming soon</span>}
          </button>
        ))}
      </div>

      {/* ── Create post modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Create post</h2>
              <button onClick={resetCreate} className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">&times;</button>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Post type</label>
              <select className={inputClass} value={newType} onChange={(e) => setNewType(e.target.value)}>
                {postTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Platforms</label>
              <PlatformToggles active={newPlatforms} onToggle={(plat) => setNewPlatforms((prev) => prev.includes(plat) ? prev.filter((x) => x !== plat) : [...prev, plat])} />
            </div>

            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-gray-500">Content</label>
                <button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating}
                  className="cursor-pointer rounded-md bg-purple-500 px-3 py-1 text-[11px] font-medium text-white transition-all duration-200 hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aiGenerating ? "Generating..." : "Generate with AI"}
                </button>
              </div>
              <textarea className={inputClass + " resize-none"} rows={5} placeholder="Write your post content or tap Generate with AI..." value={newContent} onChange={(e) => setNewContent(e.target.value)} />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs text-gray-500">Hashtags</label>
              <input className={inputClass} placeholder="#physiotherapy #health" value={newHashtags} onChange={(e) => setNewHashtags(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={resetCreate} className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-700 transition-all duration-200 hover:border-gray-400">Cancel</button>
              <button onClick={handleCreatePost} disabled={posting} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
                {posting ? "Creating..." : "Create post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Coming soon tab content ── */}
      {activeTab !== "posts" && (() => {
        var tab = contentTabs.find((t) => t.id === activeTab);
        return (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg font-medium text-gray-900">{tab?.label}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">Coming soon</span>
            </div>
            <p className="mb-4 max-w-md text-sm text-gray-500">{tab?.desc}</p>
            <button className="cursor-pointer rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-medium text-emerald-700 transition-all duration-200 hover:bg-emerald-100">
              Notify me when ready
            </button>
          </div>
        );
      })()}

      {/* ── Posts tab content ── */}
      {activeTab === "posts" && (
        <div className="grid grid-cols-[1fr_280px] gap-5">
          {/* LEFT — Post cards */}
          <div>
            {loading ? (
              <div className="flex min-h-[30vh] items-center justify-center">
                <div className="text-sm text-gray-400">Loading posts...</div>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
                <div className="mb-2 text-sm font-medium text-gray-700">No posts yet</div>
                <p className="mb-3 max-w-sm text-xs text-gray-500">Create your first post or let AI generate content for you. Posts will appear here as you use the platform.</p>
                <button onClick={() => setShowCreate(true)} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600">+ Create your first post</button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">Your posts</span>
                  <span className="text-[11px] text-gray-400">{posts.length} post{posts.length !== 1 ? "s" : ""}</span>
                </div>

                {posts.map((post) => (
                  <div key={post.id} className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
                    {/* Post header visual */}
                    <div className="relative flex h-44 items-center justify-center text-center text-white" style={{ background: POST_GRADIENTS[post.post_type] || POST_GRADIENTS.default }}>
                      <div>
                        {post.post_type && (
                          <div className="text-[9px] uppercase tracking-[3px] opacity-70">
                            {POST_TYPE_LABELS[post.post_type] || post.post_type}
                          </div>
                        )}
                        {post.title ? (
                          <>
                            <div className="mt-1 text-xl font-bold">{post.title}</div>
                            {post.subtitle && <div className="text-xl font-bold">{post.subtitle}</div>}
                          </>
                        ) : (
                          <div className="mt-1 max-w-xs text-sm font-medium opacity-90">
                            {post.content.length > 80 ? post.content.slice(0, 80) + "..." : post.content}
                          </div>
                        )}
                      </div>
                      <span className="absolute right-3 top-3 rounded bg-white/20 px-2 py-0.5 text-[8px] text-white backdrop-blur">
                        {POST_TYPE_LABELS[post.post_type] || "Post"}
                      </span>
                    </div>

                    {/* Post body */}
                    <div className="p-5">
                      <PlatformToggles
                        active={postPlatforms[post.id] || post.platforms || []}
                        onToggle={(plat) => togglePostPlatform(post.id, plat)}
                      />
                      <div className="mb-2 text-[13px] leading-relaxed text-gray-700">{post.content}</div>
                      {post.hashtags && (
                        <div className="mb-3 text-[11px] text-blue-500">{post.hashtags}</div>
                      )}
                      {post.ai_insight && (
                        <div className="mb-3 rounded-xl bg-gray-50 p-3">
                          <span className="text-[10px] font-medium text-gray-500">AI insight: </span>
                          <span className="text-[10px] text-gray-500">{post.ai_insight}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button onClick={() => alert(`Posted to ${getActiveNames(post.id)}! Booking tracking enabled.`)} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600">Post now</button>
                          <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Schedule</button>
                          <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Edit</button>
                        </div>
                        <div className="flex gap-3">
                          <span className="cursor-pointer text-[10px] text-purple-500 transition-colors hover:text-purple-700">Make reel</span>
                          <span className="cursor-pointer text-[10px] text-blue-500 transition-colors hover:text-blue-700">Translate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Card 1: Content calendar */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">April 2026</div>
              <div className="mb-1 grid grid-cols-7 gap-0">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="py-1 text-center text-[9px] text-gray-400">{d}</div>
                ))}
              </div>
              {calRows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-7 gap-0">
                  {row.map((cell, ci) => (
                    <div key={ci} className="flex flex-col items-center py-1">
                      {cell.d === 0 ? <span className="h-5" /> : (
                        <>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-lg text-[10px] ${cell.today ? "bg-emerald-50 font-medium text-emerald-600" : cell.muted ? "text-gray-300" : "text-gray-700"}`}>{cell.d}</span>
                          {cell.dot && <span className="mx-auto mt-0.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cell.dot }} />}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              <div className="mt-2 flex flex-wrap gap-2 text-[9px] text-gray-400">
                {[
                  { c: "#E4405F", l: "Instagram" }, { c: "#1877F2", l: "Facebook" }, { c: "#FF0000", l: "YouTube" },
                  { c: "#0A66C2", l: "LinkedIn" }, { c: "#10b981", l: "Multi" }, { c: "#dc2626", l: "Health day" },
                ].map((x) => (
                  <span key={x.l} className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: x.c }} />{x.l}</span>
                ))}
              </div>
            </div>

            {/* Card 2: Upcoming health days */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Upcoming health days</div>
              {[
                { day: "17", bg: "bg-red-50", text: "text-red-600", name: "World Hypertension Day", date: "May 17", badge: "Ready", badgeClass: "bg-emerald-50 text-emerald-600" },
                { day: "31", bg: "bg-amber-50", text: "text-amber-600", name: "World No Tobacco Day", date: "May 31", badge: "Drafting", badgeClass: "bg-amber-50 text-amber-600" },
                { day: "21", bg: "bg-blue-50", text: "text-blue-600", name: "International Yoga Day", date: "Jun 21", badge: "Planned", badgeClass: "bg-gray-100 text-gray-500" },
              ].map((h) => (
                <div key={h.day} className="flex items-center gap-2.5 border-b border-gray-50 py-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold ${h.bg} ${h.text}`}>{h.day}</div>
                  <div className="flex-1"><div className="text-[11px] font-medium text-gray-900">{h.name}</div><div className="text-[9px] text-gray-400">{h.date}</div></div>
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${h.badgeClass}`}>{h.badge}</span>
                </div>
              ))}
            </div>

            {/* Card 3: Channel performance */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Channel performance</div>
              {[
                { icon: "Ig", color: "bg-pink-500", name: "Instagram", stat: "847 reach", book: "4 bookings" },
                { icon: "Fb", color: "bg-blue-500", name: "Facebook", stat: "2.3K reach", book: "2 bookings" },
                { icon: "G", color: "bg-blue-400", name: "Google", stat: "320 impressions", book: "1 booking" },
                { icon: "in", color: "bg-blue-700", name: "LinkedIn", stat: "156 views", book: "0 bookings" },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-2 border-b border-gray-50 py-2">
                  <div className={`flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white ${c.color}`}>{c.icon}</div>
                  <span className="flex-1 text-[11px] text-gray-700">{c.name}</span>
                  <span className="text-[10px] text-gray-400">{c.stat}</span>
                  <span className="text-[10px] font-medium text-emerald-600">{c.book}</span>
                </div>
              ))}
              <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-[10px] text-emerald-700">Instagram drives 57% of bookings. Increase to 4x/week.</div>
            </div>

            {/* Card 4: Auto-post settings */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Auto-post settings</div>
              {[
                { name: "Health day auto-posts", on: true },
                { name: "Weekly patient tips", on: true },
                { name: "HMS milestones", on: true },
                { name: "Review highlights", on: true },
                { name: "Translate to Telugu", on: false },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between border-b border-gray-50 py-2">
                  <span className="text-[11px] text-gray-700">{s.name}</span>
                  <div className={`flex h-4 w-7 items-center rounded-full px-0.5 ${s.on ? "bg-emerald-500" : "bg-gray-300"}`}>
                    <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-200 ${s.on ? "ml-auto" : ""}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Card 5: Quick upload */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Quick upload</div>
              <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 p-4">
                <div className="text-[11px] text-gray-500">Drop video or photos</div>
                <div className="text-[10px] text-gray-400">or WhatsApp forward</div>
              </div>
              <div className="mt-2 flex gap-1.5">
                {["Upload video", "Upload photos", "WhatsApp import"].map((b) => (
                  <button key={b} className="flex-1 cursor-pointer rounded-lg border border-gray-200 py-1.5 text-[9px] text-gray-600 transition-all duration-200 hover:bg-gray-50">{b}</button>
                ))}
              </div>
            </div>

            {/* Card 6: AI content types */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">AI content types</div>
              {[
                { dot: "bg-emerald-500", name: "Health day posts" },
                { dot: "bg-blue-500", name: "Patient education" },
                { dot: "bg-purple-500", name: "Doctor videos" },
                { dot: "bg-amber-500", name: "Milestones (HMS)" },
                { dot: "bg-pink-500", name: "Before/after" },
                { dot: "bg-red-500", name: "Review highlights" },
                { dot: "bg-gray-400", name: "Behind-the-scenes" },
                { dot: "bg-cyan-500", name: "Seasonal offers" },
              ].map((t) => (
                <div key={t.name} className="flex items-center gap-2 py-1">
                  <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                  <span className="text-[11px] text-gray-700">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
