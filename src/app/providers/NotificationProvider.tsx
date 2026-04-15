"use client";

import { createContext, useContext, useState, useCallback } from "react";

type NotificationType = "error" | "success" | "warning" | "info" | "mandatory";

type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
};

var TYPE_COLORS: Record<NotificationType, string> = {
  error: "#dc2626",
  success: "#059669",
  warning: "#d97706",
  info: "#2563eb",
  mandatory: "#7c3aed",
};

type NotifyFn = (title: string, message?: string) => void;

type NotifyAPI = {
  success: NotifyFn;
  error: NotifyFn;
  warning: NotifyFn;
  info: NotifyFn;
  mandatory: NotifyFn;
};

var NotificationContext = createContext<NotifyAPI>({
  success: function () {},
  error: function () {},
  warning: function () {},
  info: function () {},
  mandatory: function () {},
});

var nextId = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  var [notifications, setNotifications] = useState<Notification[]>([]);

  var dismiss = useCallback(function (id: number) {
    setNotifications(function (prev) { return prev.filter(function (n) { return n.id !== id; }); });
  }, []);

  var push = useCallback(function (type: NotificationType, title: string, message?: string) {
    var id = ++nextId;
    var notif: Notification = { id: id, type: type, title: title, message: message || "" };
    setNotifications(function (prev) { return [...prev, notif]; });

    if (type === "mandatory") {
      console.log("[MHAI Mandatory Notification]", title, message || "");
    }

    // Auto-dismiss success after 3s
    if (type === "success") {
      setTimeout(function () { dismiss(id); }, 3000);
    }
  }, [dismiss]);

  var notify: NotifyAPI = {
    success: useCallback(function (t: string, m?: string) { push("success", t, m); }, [push]),
    error: useCallback(function (t: string, m?: string) { push("error", t, m); }, [push]),
    warning: useCallback(function (t: string, m?: string) { push("warning", t, m); }, [push]),
    info: useCallback(function (t: string, m?: string) { push("info", t, m); }, [push]),
    mandatory: useCallback(function (t: string, m?: string) { push("mandatory", t, m); }, [push]),
  };

  return (
    <NotificationContext.Provider value={notify}>
      {children}

      {/* Notification overlay */}
      {notifications.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          {notifications.map(function (n) {
            var color = TYPE_COLORS[n.type];
            return (
              <div key={n.id} className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div style={{ height: 4, backgroundColor: color }} />
                <div className="p-5">
                  <div className="mb-1 text-[15px] font-semibold text-gray-900">{n.title}</div>
                  {n.message && <div className="mb-4 text-sm text-gray-600">{n.message}</div>}
                  <button
                    onClick={function () { dismiss(n.id); }}
                    className="w-full cursor-pointer rounded-lg py-2.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: color }}
                  >
                    {n.type === "mandatory" ? "I understand" : "OK"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
