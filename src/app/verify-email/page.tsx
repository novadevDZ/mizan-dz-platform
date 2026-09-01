"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    Mail,
    Moon,
    RefreshCw,
    ShieldCheck,
    Sun,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {authClient} from "@/src/lib/auth-client";
import {useTheme} from "@/src/hooks/use-theme";

export default function VerifyEmailPage() {
    const {
        theme,
        setTheme,
    } = useTheme();

    const [
        email,
        setEmail,
    ] = useState<string | null>(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        sending,
        setSending,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState("");

    const [
        mounted,
        setMounted,
    ] = useState(false);

    const [
        resolvedDark,
        setResolvedDark,
    ] = useState(false);

    useEffect(() => {
        setMounted(true);

        function updateResolvedTheme() {
            if (theme === "dark") {
                setResolvedDark(true);
                return;
            }

            if (theme === "light") {
                setResolvedDark(false);
                return;
            }

            setResolvedDark(
                window.matchMedia(
                    "(prefers-color-scheme: dark)",
                ).matches,
            );
        }

        updateResolvedTheme();

        const mediaQuery =
            window.matchMedia(
                "(prefers-color-scheme: dark)",
            );

        function handleSystemThemeChange() {
            if (theme === "system") {
                setResolvedDark(
                    mediaQuery.matches,
                );
            }
        }

        mediaQuery.addEventListener(
            "change",
            handleSystemThemeChange,
        );

        return () => {
            mediaQuery.removeEventListener(
                "change",
                handleSystemThemeChange,
            );
        };
    }, [theme]);

    async function loadSession() {
        setLoading(true);
        setError("");

        try {
            const {
                data: session,
                error: sessionError,
            } = await authClient.getSession();

            if (
                sessionError ||
                !session
            ) {
                window.location.assign(
                    "/login",
                );

                return;
            }

            const userEmail =
                session.user.email ??
                null;

            setEmail(
                userEmail,
            );

            if (
                session.user
                    .emailVerified
            ) {
                window.location.assign(
                    "/onboarding",
                );

                return;
            }
        } catch (error) {
            console.error(
                "[VerifyEmail] Failed to load session",
                error,
            );

            setError(
                "We couldn't load your account information.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadSession();
    }, []);

    async function sendVerificationEmail() {
        if (
            !email ||
            sending
        ) {
            return;
        }

        setSending(true);
        setError("");
        setSuccess("");

        try {
            const {
                error: verificationError,
            } =
                await authClient.sendVerificationEmail(
                    {
                        email,
                        callbackURL:
                            "/onboarding",
                    },
                );

            if (
                verificationError
            ) {
                console.error(
                    "[VerifyEmail] Failed to send verification email",
                    verificationError,
                );

                setError(
                    verificationError.message ??
                    "We couldn't send the verification email. Please try again.",
                );

                return;
            }

            setSuccess(
                "Verification email sent. Check your inbox and click the verification link.",
            );
        } catch (error) {
            console.error(
                "[VerifyEmail] Send verification error",
                error,
            );

            setError(
                "Something went wrong while sending the verification email.",
            );
        } finally {
            setSending(false);
        }
    }

    async function checkVerification() {
        setError("");
        setSuccess("");

        try {
            const {
                data: session,
                error: sessionError,
            } = await authClient.getSession();

            if (
                sessionError ||
                !session
            ) {
                window.location.assign(
                    "/login",
                );

                return;
            }

            if (
                session.user
                    .emailVerified
            ) {
                setSuccess(
                    "Your email has been verified. Redirecting...",
                );

                window.location.assign(
                    "/onboarding",
                );

                return;
            }

            setError(
                "Your email is not verified yet. Open the verification link from your email and try again.",
            );
        } catch (error) {
            console.error(
                "[VerifyEmail] Verification check failed",
                error,
            );

            setError(
                "We couldn't check your verification status.",
            );
        }
    }

    function toggleTheme() {
        if (!mounted) {
            return;
        }

        if (theme === "dark") {
            setTheme("light");
            return;
        }

        if (theme === "light") {
            setTheme("dark");
            return;
        }

        const prefersDark =
            window.matchMedia(
                "(prefers-color-scheme: dark)",
            ).matches;

        setTheme(
            prefersDark
                ? "light"
                : "dark",
        );
    }

    /*
     * Direct theme classes.
     * These do not depend on Tailwind's dark variant
     * or your semantic color configuration.
     */
    const pageBackground =
        resolvedDark
            ? "bg-zinc-950 text-zinc-100"
            : "bg-slate-50 text-slate-950";

    const cardBackground =
        resolvedDark
            ? "bg-zinc-900"
            : "bg-white";

    const borderColor =
        resolvedDark
            ? "border-zinc-800"
            : "border-slate-200";

    const mutedText =
        resolvedDark
            ? "text-zinc-400"
            : "text-slate-500";

    const primaryText =
        resolvedDark
            ? "text-blue-400"
            : "text-blue-600";

    const mutedBackground =
        resolvedDark
            ? "bg-zinc-800/70"
            : "bg-slate-100";

    const iconBackground =
        resolvedDark
            ? "bg-blue-500/10"
            : "bg-blue-50";

    if (loading) {
        return (
            <div
                className={`min-h-screen px-4 py-8 transition-colors sm:px-6 lg:px-8 ${pageBackground}`}
            >
                <div className="mx-auto flex min-h-[80vh] w-full max-w-lg items-center justify-center">
                    <div
                        className={`w-full rounded-2xl border p-8 text-center shadow-sm ${cardBackground} ${borderColor}`}
                    >
                        <div
                            className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${iconBackground} ${primaryText}`}
                        >
                            <RefreshCw className="h-5 w-5 animate-spin"/>
                        </div>

                        <p
                            className={`mt-4 text-sm ${mutedText}`}
                        >
                            Checking your account...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen px-4 py-8 transition-colors sm:px-6 lg:px-8 ${pageBackground}`}
        >
            <div className="mx-auto flex min-h-[80vh] w-full max-w-lg items-center justify-center">
                <div className="w-full">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <Link
                            href="/onboarding"
                            className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
                                resolvedDark
                                    ? "text-zinc-400 hover:text-white"
                                    : "text-slate-500 hover:text-slate-950"
                            }`}
                        >
                            <ArrowLeft className="h-4 w-4"/>
                            Back
                        </Link>

                        {/* Brand + Theme */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span
                                    className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/20">
                                    M
                                </span>

                                <span
                                    className={`text-sm font-bold tracking-tight ${
                                        resolvedDark
                                            ? "text-white"
                                            : "text-slate-950"
                                    }`}
                                >
                                    Mizan DZ
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    toggleTheme
                                }
                                disabled={
                                    !mounted
                                }
                                aria-label={
                                    resolvedDark
                                        ? "Switch to light mode"
                                        : "Switch to dark mode"
                                }
                                title={
                                    resolvedDark
                                        ? "Switch to light mode"
                                        : "Switch to dark mode"
                                }
                                className={`grid size-9 place-items-center rounded-xl border shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                    resolvedDark
                                        ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                                }`}
                            >
                                {!mounted ? (
                                    <Moon className="h-4 w-4"/>
                                ) : resolvedDark ? (
                                    <Sun className="h-4 w-4"/>
                                ) : (
                                    <Moon className="h-4 w-4"/>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Main Card */}
                    <div
                        className={`overflow-hidden rounded-3xl border shadow-sm ${cardBackground} ${borderColor}`}
                    >
                        <div className="p-6 text-center sm:p-8">
                            {/* Icon */}
                            <div
                                className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${iconBackground} ${primaryText}`}
                            >
                                <Mail className="h-7 w-7"/>
                            </div>

                            {/* Heading */}
                            <div className="mt-6">
                                <div
                                    className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                        resolvedDark
                                            ? "bg-blue-500/10 text-blue-400"
                                            : "bg-blue-50 text-blue-600"
                                    }`}
                                >
                                    <ShieldCheck className="h-3.5 w-3.5"/>

                                    Account verification
                                </div>

                                <h1
                                    className={`text-2xl font-bold tracking-[-0.035em] sm:text-3xl ${
                                        resolvedDark
                                            ? "text-white"
                                            : "text-slate-950"
                                    }`}
                                >
                                    Verify your email
                                </h1>

                                <p
                                    className={`mx-auto mt-3 max-w-md text-sm leading-6 ${mutedText}`}
                                >
                                    We need to verify your email address before you can join an organization or access
                                    organization invitations.
                                </p>
                            </div>

                            {/* Email */}
                            {email && (
                                <div
                                    className={`mt-6 rounded-xl border px-4 py-3 ${borderColor} ${mutedBackground}`}
                                >
                                    <p
                                        className={`text-xs ${mutedText}`}
                                    >
                                        Verification email will be sent to
                                    </p>

                                    <p
                                        className={`mt-1 break-all text-sm font-semibold ${
                                            resolvedDark
                                                ? "text-zinc-100"
                                                : "text-slate-950"
                                        }`}
                                    >
                                        {email}
                                    </p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div
                                    role="alert"
                                    aria-live="polite"
                                    className={`mt-5 rounded-xl border px-4 py-3.5 text-left text-sm font-medium ${
                                        resolvedDark
                                            ? "border-red-500/20 bg-red-500/10 text-red-400"
                                            : "border-red-200 bg-red-50 text-red-700"
                                    }`}
                                >
                                    {error}
                                </div>
                            )}

                            {/* Success */}
                            {success && (
                                <div
                                    role="status"
                                    aria-live="polite"
                                    className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium ${
                                        resolvedDark
                                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    }`}
                                >
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0"/>

                                    <span>
                                        {success}
                                    </span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-6 space-y-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        void sendVerificationEmail()
                                    }
                                    disabled={
                                        sending ||
                                        !email
                                    }
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {sending ? (
                                        <>
                                            <span
                                                className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"/>

                                            Sending verification email...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4"/>
                                            Send verification email
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void checkVerification()
                                    }
                                    className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                        resolvedDark
                                            ? "border-zinc-800 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
                                            : "border-slate-200 bg-white text-slate-950 hover:bg-slate-100"
                                    }`}
                                >
                                    <RefreshCw className="h-4 w-4"/>

                                    I've verified my email
                                </button>
                            </div>

                            {/* Help */}
                            <div
                                className={`mt-6 rounded-xl px-4 py-3.5 text-left ${mutedBackground}`}
                            >
                                <p
                                    className={`text-xs leading-5 ${mutedText}`}
                                >
                                    Didn't receive the email? Check your spam or junk folder. You can safely request
                                    another verification email.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div
                            className={`border-t px-6 py-4 text-center sm:px-8 ${borderColor} ${
                                resolvedDark
                                    ? "bg-zinc-800/40"
                                    : "bg-slate-50"
                            }`}
                        >
                            <p
                                className={`text-xs leading-5 ${mutedText}`}
                            >
                                After verification, you'll return to the Mizan DZ organization setup flow.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}