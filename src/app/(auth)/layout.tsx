export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        background:
          "radial-gradient(ellipse 60% 40% at 80% 10%, rgba(16,185,129,.05), transparent), #0a0f0d",
      }}
    >
      {children}
    </div>
  );
}
