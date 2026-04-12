import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { register as registerUser } from "@/lib/auth";

const schema = z
  .object({
    name: z.string().min(2, "Naam moet minimaal 2 tekens bevatten"),
    email: z.string().email("Ongeldig e-mailadres"),
    password: z.string().min(8, "Wachtwoord moet minimaal 8 tekens bevatten"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Wachtwoorden komen niet overeen",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">FactuurFlow</span>
          </div>
          <p className="text-gray-500 text-sm">Start gratis — geen creditcard nodig</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Account aanmaken</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Naam */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volledige naam
              </label>
              <input
                {...register("name")}
                type="text"
                autoComplete="name"
                placeholder="Jan de Vries"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                           placeholder-gray-400 transition"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mailadres
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="jij@bedrijf.nl"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                           placeholder-gray-400 transition"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Wachtwoord */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wachtwoord
              </label>
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                placeholder="Minimaal 8 tekens"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                           placeholder-gray-400 transition"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Bevestig wachtwoord */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wachtwoord bevestigen
              </label>
              <input
                {...register("confirmPassword")}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                           placeholder-gray-400 transition"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60
                         text-white font-medium py-2.5 px-4 rounded-lg text-sm transition
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {isSubmitting ? "Account aanmaken…" : "Account aanmaken"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Al een account?{" "}
            <a
              href="/login"
              onClick={(e) => { e.preventDefault(); navigate("/login"); }}
              className="text-green-600 font-medium hover:underline"
            >
              Inloggen
            </a>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Door je te registreren ga je akkoord met onze{" "}
          <span className="underline cursor-pointer">algemene voorwaarden</span> en{" "}
          <span className="underline cursor-pointer">privacybeleid</span>.
        </p>
      </div>
    </div>
  );
}
