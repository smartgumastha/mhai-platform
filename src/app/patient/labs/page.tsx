"use client";

export default function PatientLabsPage() {
  return (
    <div className="px-8 py-6">
      <h1 className="mb-0.5 text-2xl font-bold text-gray-900">Lab Reports</h1>
      <p className="mb-6 text-sm text-gray-400">Diagnostic test results uploaded by your clinic</p>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
        <div className="mb-3 text-5xl">⚗</div>
        <div className="text-base font-semibold text-gray-600">Lab Reports — Coming Soon</div>
        <div className="mx-auto mt-2 max-w-xs text-xs text-gray-400">
          When your clinic uploads your diagnostic test results, they will appear here automatically
        </div>
      </div>
    </div>
  );
}
