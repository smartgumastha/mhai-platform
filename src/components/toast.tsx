"use client";

import { useEffect, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";
type ToastMsg = { id: number; text: string; type: ToastType };

var listeners: ((msg: ToastMsg) => void)[] = [];
var nextId = 0;

export function showToast(text: string, type: ToastType = "info") {
  var msg = { id: ++nextId, text, type };
  listeners.forEach((fn) => fn(msg));
}

export function Toast() {
  var [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(() => {
    var handler = (msg: ToastMsg) => {
      setItems((prev) => [...prev, msg]);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== msg.id));
      }, 3000);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((fn) => fn !== handler);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[999] flex -translate-x-1/2 flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-lg px-4 py-2.5 text-sm shadow-lg transition-all ${
            item.type === "success"
              ? "bg-emerald-600 text-white"
              : item.type === "error"
                ? "bg-red-600 text-white"
                : "bg-[#1f2e28] text-gray-300 border border-[#2a3f35]"
          }`}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}
