import { useLocation } from "wouter";

export default function PricingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Pricing coming soon</h1>
        <p className="text-gray-500 mb-2">
          FactuurFlow is <span className="font-semibold text-gray-800">completely free</span> while we're in early access.
        </p>
        <p className="text-gray-500 mb-8">
          Create unlimited invoices, track expenses, and manage clients — no credit card required.
        </p>

        <button
          onClick={() => navigate("/register")}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition text-sm mb-3"
        >
          Create free account
        </button>
        <button
          onClick={() => navigate("/login")}
          className="w-full text-sm text-gray-500 hover:text-gray-800 transition"
        >
          Already have an account? Sign in
        </button>
      </div>

      <p className="mt-12 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} FactuurFlow
      </p>
    </div>
  );
}
