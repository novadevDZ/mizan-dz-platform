"use client";

import Link from "next/link";
import {useMemo, useState} from "react";
import {
    ArrowRight,
    Check,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    Phone,
    UserRound,
} from "lucide-react";
import {authClient} from "@/src/lib/auth-client";

const PHONE_REGEX = /^(0(5|6|7)\d{8}|\+213(5|6|7)\d{8})$/;

const DEFAULT_AVATAR = "/avatars/default-avatar.svg";

function getPasswordStrength(password: string) {
    let score = 0;

    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (!password) return {score: 0, label: ""};
    if (score <= 2) return {score, label: "Weak"};
    if (score === 3) return {score, label: "Fair"};
    if (score === 4) return {score, label: "Strong"};
    return {score, label: "Very strong"};
}

function getSignupErrorMessage(error: {
    code?: string | null;
    message?: string | null;
    status?: number;
}) {
    const code = String(error.code ?? "");

    if (
        code === "USER_ALREADY_EXISTS" ||
        code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
    ) {
        return "An account with this email already exists. Try signing in instead.";
    }

    if (code === "FIELD_NOT_ALLOWED") {
        return "The authentication server rejected a custom registration field. Make sure `phone` is configured in Better Auth `user.additionalFields`.";
    }

    if (code === "VALIDATION_ERROR" || code === "INVALID_INPUT") {
        return error.message || "Some registration fields are invalid.";
    }

    if (code === "PASSWORD_TOO_SHORT") {
        return "Password must be at least 8 characters.";
    }

    if (code === "PASSWORD_TOO_LONG") {
        return "Password is too long.";
    }

    if (error.status === 500) {
        return "Authentication server error. Check the Better Auth database configuration and server logs.";
    }

    return error.message || "We couldn't create your account. Please try again.";
}

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const passwordStrength = useMemo(
        () => getPasswordStrength(password),
        [password],
    );

    function validate() {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = phone.replace(/\s+/g, "").trim();

        if (name.trim().length < 2) return "Please enter your full name.";

        if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            return "Please enter a valid email address.";
        }

        if (!PHONE_REGEX.test(normalizedPhone)) {
            return "Please enter a valid Algerian phone number, e.g. 0551234567.";
        }

        if (password.length < 8) {
            return "Password must be at least 8 characters.";
        }

        if (password !== confirmPassword) {
            return "Passwords do not match.";
        }

        return null;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (loading) return;

        const validationError = validate();

        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setLoading(true);

        try {
            const normalizedEmail = email.trim().toLowerCase();
            const normalizedPhone = phone.replace(/\s+/g, "").trim();

            const result = await authClient.signUp.email({
                name: name.trim(),
                email: normalizedEmail,
                password,
                phone: normalizedPhone,
                // `image` is a core Better Auth user field.
                // Without supplying it (or setting it in a hook),
                // it is expected to remain null.
                image: DEFAULT_AVATAR,

                callbackURL: "/onboarding",
            });

            if (result.error) {
                console.error("[Mizan DZ] Better Auth sign-up error:", {
                    code: result.error.code,
                    status: result.error.status,
                    message: result.error.message,
                });

                setError(getSignupErrorMessage(result.error));
                return;
            }

            window.location.assign("/onboarding");
        } catch (unknownError) {
            console.error(
                "[Mizan DZ] Unexpected sign-up error:",
                unknownError,
            );

            setError(
                "Unable to reach the authentication server. Check the server and database configuration.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mizan-page-enter">
            <div className="mb-8 lg:hidden">
                <Link href="/" className="inline-flex items-center gap-3">
                    <span
                        className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary)] text-sm font-black text-white shadow-lg shadow-blue-500/20">
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
                        <div
                            className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--mizan-blue-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]"/>
                            Start your Mizan workspace
                        </div>

                        <h2 className="text-[1.85rem] font-bold tracking-[-0.035em] text-[var(--text-primary)]">
                            Create your account
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                            Set up your account and start running your business from one place.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-[18px]" noValidate>
                        <div>
                            <label
                                htmlFor="register-name"
                                className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                            >
                                Full name
                            </label>

                            <div className="relative">
                                <UserRound
                                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"/>

                                <input
                                    id="register-name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    autoFocus
                                    required
                                    disabled={loading}
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="Ahmed Ben Ali"
                                    className="h-12 pl-11 pr-4 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="register-email"
                                className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                            >
                                Email address
                            </label>

                            <div className="relative">
                                <Mail
                                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"/>

                                <input
                                    id="register-email"
                                    name="email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    required
                                    disabled={loading}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="you@company.dz"
                                    className="h-12 pl-11 pr-4 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="register-phone"
                                className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                            >
                                Algerian phone number
                            </label>

                            <div className="relative">
                                <Phone
                                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"/>

                                <input
                                    id="register-phone"
                                    name="phone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    required
                                    disabled={loading}
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="0551 23 45 67"
                                    className="h-12 pl-11 pr-4 text-sm"
                                />
                            </div>

                            <p className="mt-1.5 text-xs leading-5 text-[var(--text-muted)]">
                                Example: 0551234567
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="register-password"
                                className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <LockKeyhole
                                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"/>

                                <input
                                    id="register-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    disabled={loading}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="At least 8 characters"
                                    className="h-12 pl-11 pr-12 text-sm"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    disabled={loading}
                                    aria-label={
                                        showPassword ? "Hide password" : "Show password"
                                    }
                                    className="mizan-icon-button absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4"/>
                                    ) : (
                                        <Eye className="h-4 w-4"/>
                                    )}
                                </button>
                            </div>

                            {password && (
                                <div className="mt-2.5">
                                    <div className="flex gap-1">
                                        {Array.from({length: 5}).map((_, index) => (
                                            <span
                                                key={index}
                                                className={`h-1 flex-1 rounded-full ${
                                                    index < passwordStrength.score
                                                        ? "bg-[var(--primary)]"
                                                        : "bg-[var(--surface-tertiary)]"
                                                }`}
                                            />
                                        ))}
                                    </div>

                                    <p className="mt-1.5 text-xs font-medium text-[var(--text-muted)]">
                                        Password strength: {passwordStrength.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="register-confirm-password"
                                className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                            >
                                Confirm password
                            </label>

                            <div className="relative">
                                <LockKeyhole
                                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"/>

                                <input
                                    id="register-confirm-password"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    disabled={loading}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="Re-enter your password"
                                    className="h-12 pl-11 pr-12 text-sm"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((value) => !value)
                                    }
                                    disabled={loading}
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="mizan-icon-button absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4"/>
                                    ) : (
                                        <Eye className="h-4 w-4"/>
                                    )}
                                </button>
                            </div>

                            {confirmPassword && (
                                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                                    <span
                                        className={`grid h-4 w-4 place-items-center rounded-full ${
                                            password === confirmPassword
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-slate-100 text-slate-400"
                                        }`}
                                    >
                                        <Check className="h-2.5 w-2.5"/>
                                    </span>

                                    <span
                                        className={
                                            password === confirmPassword
                                                ? "text-emerald-700"
                                                : "text-[var(--text-muted)]"
                                        }
                                    >
                                        {password === confirmPassword
                                            ? "Passwords match"
                                            : "Passwords must match"}
                                    </span>
                                </div>
                            )}
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
                            className="mizan-primary-action group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white"
                        >
                            {loading ? (
                                <>
                                    <span
                                        aria-hidden="true"
                                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                                    />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight
                                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"/>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div
                    className="border-t border-[var(--border-soft)] bg-[var(--surface-secondary)] px-6 py-4 text-center sm:px-8">
                    <p className="text-sm text-[var(--text-muted)]">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
