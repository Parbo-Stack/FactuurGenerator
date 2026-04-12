import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { register as registerUser } from "@/lib/auth";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
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
      const user = await registerUser(data.name, data.email, data.password);
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
            Start invoicing<br />
            in minutes.
          </h1>
          <p className="text-green-100 text-lg leading-relaxed mb-12 max-w-sm">
            Create your free account and send your first professional invoice today. No credit card required.
          </p>

          {/* Checklist */}
          <div className="space-y-4">
            {[
              "Professional PDF invoices with your branding",
              "Bill in 20+ currencies worldwide",
              "Track payments and overdue invoices",
              "Send invoices by email in one click",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-green-50 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative">
          <p className="text-green-200 text-sm">
            Already have an account?{" "}
            <a
              href="/login"
              onClick={(e) => { e.preventDefault(); navigate("/login"); }}
              className="text-white font-semibold underline underline-offset-2"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>

      {/* ── Right: Register form ── */}
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
              <h2 className="text-xl font-semibold text-gray-900">{t("auth.register.title")}</h2>
              <p className="text-sm text-gray-500 mt-1">{t("auth.register.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.register.name")}
                </label>
                <input
                  {...register("name")}
                  type="text"
                  autoComplete="name"
                  placeholder="John Smith"
                  className={inputCls}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.register.email")}
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
                  {t("auth.register.password")}
                </label>
                <input
                  {...register("password")}
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("auth.register.passwordHint")}
                  className={inputCls}
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={inputCls}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
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
                {isSubmitting ? t("auth.register.creating") : t("auth.register.submit")}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {t("auth.register.hasAccount")}{" "}
              <a
                href="/login"
                onClick={(e) => { e.preventDefault(); navigate("/login"); }}
                className="text-green-600 font-medium hover:underline"
              >
                {t("auth.register.loginLink")}
              </a>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} FactuurFlow. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
