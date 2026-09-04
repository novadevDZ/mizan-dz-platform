"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShieldCheck,
} from "lucide-react";

import { authClient } from "@/src/lib/auth-client";

type AuthError = {
    code?: string | null;
    message?: string | null;
    status?: number;
};

function getLoginErrorMessage(error?: AuthError | null) {
    if (!error) {
        return "Invalid email or password.";
    }

    const code = String(error.code ?? "").toUpperCase();

    if (
        code === "INVALID_EMAIL_OR_PASSWORD" ||
        code === "INVALID_CREDENTIALS" ||
        code === "INVALID_PASSWORD"
    ) {
        return "Invalid email or password.";
    }

    if (code === "USER_NOT_FOUND") {
        return "No account was found with this email address.";
    }

    if (code === "EMAIL_NOT_VERIFIED") {
        return "Please verify your email address before signing in.";
    }

    if (code === "TOO_MANY_REQUESTS") {
        return "Too many login attempts. Please try again later.";
    }

    if (error.status === 401) {
        return "Invalid email or password.";
    }

    if (error.status === 403) {
        return "You are not allowed to sign in with these credentials.";
    }

    if (error.status === 500) {
        return "Authentication server error. Please try again later.";
    }

    return (
        error.message ||
        "We couldn't sign you in. Please check your details and try again."
    );
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>,
    ) {
        e.preventDefault();

        if (loading) {
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Please enter your email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const result = await authClient.signIn.email({
                email: normalizedEmail,
                password,
            });

            if (result.error) {
                console.error("[Mizan DZ] Sign-in failed:", {
                    code: result.error.code,
                    message: result.error.message,
                    status: result.error.status,
                });

                setError(
                    getLoginErrorMessage(result.error),
                );

                return;
            }

            console.log("[Mizan DZ] Sign-in successful.");

            /*
             * Do not call organization.list() immediately here.
             *
             * Better Auth has already created the authenticated
             * session. The onboarding flow can safely determine
             * whether the user needs to create/select/activate
             * an organization.
             */
            window.location.assign("/onboarding");
        } catch (unknownError) {
            console.error(
                "[Mizan DZ] Unexpected sign-in error:",
                unknownError,
            );

            setError(
                "Something went wrong. Please check your connection and try again.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mizan-page-enter">
            <div className="mb-8 lg:hidden">
                <Link
                    href="/"
                    className="inline-flex items-center gap-3"
                >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary)] text-sm font-black text-white shadow-lg shadow-blue-500/20">
                        M
                    </span>

                    <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                        Mizan DZ
                    </span>
                </Link>
            </div>

            <div className="mizan-card mizan-animate-scale overflow-hidden">
                <div className="p-6 sm:p-8">
                    <div className="mb-7">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--mizan-blue-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                            <ShieldCheck className="h-3.5 w-3.5" />

                            Secure business access
                        </div>

                        <h2 className="text-[1.85rem] font-bold tracking-[-0.035em] text-[var(--text-primary)]">
                            Welcome back
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                            Sign in to continue managing your business with Mizan DZ.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                        noValidate
                    >
                        <div>
                            <label
                                htmlFor="login-email"
                                className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                            >
                                Email address
                            </label>

                            <div className="relative">
                                <Mail
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                                />

                                <input
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    disabled={loading}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);

                                        if (error) {
                                            setError("");
                                        }
                                    }}
                                    placeholder="you@company.dz"
                                    className="h-12 w-full pl-11 pr-4 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-4">
                                <label
                                    htmlFor="login-password"
                                    className="block text-sm font-semibold text-[var(--text-primary)]"
                                >
                                    Password
                                </label>

                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-semibold text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <div className="relative">
                                <LockKeyhole
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                                />

                                <input
                                    id="login-password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);

                                        if (error) {
                                            setError("");
                                        }
                                    }}
                                    placeholder="Enter your password"
                                    className="h-12 w-full pl-11 pr-12 text-sm"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (value) => !value,
                                        )
                                    }
                                    disabled={loading}
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="mizan-icon-button absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                aria-live="polite"
                                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mizan-primary-action group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <span
                                        aria-hidden="true"
                                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                                    />

                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in

                                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="border-t border-[var(--border-soft)] bg-[var(--surface-secondary)] px-6 py-4 text-center sm:px-8">
                    <p className="text-sm text-[var(--text-muted)]">
                        New to Mizan DZ?{" "}
                        <Link
                            href="/register"
                            className="font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]"
                        >
                            Create your account
                        </Link>
                    </p>
                </div>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-[var(--text-muted)]">
                Secure access to your Mizan DZ workspace.
            </p>
        </div>
    );
}