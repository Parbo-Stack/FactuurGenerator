import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { login } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Professional invoices",
    desc: "Create polished PDF invoices in seconds with your logo and branding.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: "20+ currencies",
    desc: "Bill clients worldwide in EUR, USD, GBP and 17 more currencies.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Track everything",
    desc: "Live dashboard with revenue, outstanding balances and overdue alerts.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Send with one click",
    desc: "Email invoices as PDF attachments directly from the app via Resend.",
  },
];

export default function LoginPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      const user = await login(data.email, data.password);
      queryClient.setQueryData(["auth-user"], user);
      navigate("/dashboard");
    } catch (err: any) {
      setServerError(err.message);
    }
  }

  const inputCls = `w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
    placeholder-gray-400 transition bg-white`;

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Marketing panel ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] rounded-full" />
        </div>

        <div className="relative">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">FactuurFlow</span>
          </div>

          {/* Hero text */}
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Invoice smarter.<br />
            Get paid faster.
          </h1>
          <p className="text-green-100 text-lg leading-relaxed mb-12 max-w-sm">
            The clean, modern invoicing tool for freelancers and small businesses worldwide.
          </p>

          {/* Features */}
          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{f.title}</div>
                  <div className="text-green-100 text-sm leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust line */}
        <div className="relative flex items-center gap-6 pt-8 border-t border-white/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">20+</div>
            <div className="text-xs text-green-200">Currencies</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">PDF</div>
            <div className="text-xs text-green-200">One-click export</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">Free</div>
            <div className="text-xs text-green-200">To get started</div>
          </div>
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">FactuurFlow</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t("auth.login.title")}</h2>
              <p className="text-sm text-gray-500 mt-1">{t("auth.login.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.login.email")}
                </label>
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={inputCls}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.login.password")}
                </label>
                <input
                  {...register("password")}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inputCls}
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60
                           text-white font-medium py-2.5 px-4 rounded-xl text-sm transition
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {isSubmitting ? t("auth.login.loggingIn") : t("auth.login.submit")}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {t("auth.login.noAccount")}{" "}
              <a
                href="/register"
                onClick={(e) => { e.preventDefault(); navigate("/register"); }}
                className="text-green-600 font-medium hover:underline"
              >
                {t("auth.login.registerLink")}
              </a>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} FactuurFlow. All rights reserved. ·{" "}
            <a
              href="/pricing"
              onClick={(e) => { e.preventDefault(); navigate("/pricing"); }}
              className="hover:text-gray-600 underline underline-offset-2"
            >
              Pricing
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
