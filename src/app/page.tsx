export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
      <div className="text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-lg">
            M
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            MediHost <span className="text-emerald-600">AI</span>
          </h1>
        </div>
        <p className="mb-2 text-xl text-gray-600">
          AI Marketing Platform for Healthcare
        </p>
        <p className="text-lg text-gray-400">Coming Soon</p>
        <div className="mt-8 h-1 w-24 mx-auto rounded-full bg-emerald-600" />
      </div>
    </div>
  );
}
