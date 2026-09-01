"use client";

import {
    Check,
    LogOut,
    Monitor,
    Moon,
    ShieldCheck,
    Sun,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    authClient,
} from "@/src/lib/auth-client";

import {
    useTheme,
} from "@/src/hooks/use-theme";

interface OnboardingShellProps {
    children: React.ReactNode;
}

const steps = [
    {
        id: 1,
        title: "Getting Started",
    },
    {
        id: 2,
        title: "Organization",
    },
    {
        id: 3,
        title: "Setup",
    },
];

export default function OnboardingShell({
                                            children,
                                        }: OnboardingShellProps) {
    const router =
        useRouter();

    const {
        theme,
        setTheme,
    } = useTheme();

    const {
        data: session,
        isPending,
    } = authClient.useSession();

    const [
        mounted,
        setMounted,
    ] = useState(false);

    const [
        loggingOut,
        setLoggingOut,
    ] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (
            !isPending &&
            !session?.user
        ) {
            router.replace(
                "/login",
            );
        }
    }, [
        isPending,
        session,
        router,
    ]);

    async function handleLogout() {
        if (loggingOut) {
            return;
        }

        try {
            setLoggingOut(true);

            await authClient.signOut();

            router.replace(
                "/login",
            );

            router.refresh();
        } catch (error) {
            console.error(
                "Failed to logout:",
                error,
            );

            setLoggingOut(false);
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

    if (
        isPending ||
        !session?.user
    ) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"/>

                    <p className="text-xs text-muted-foreground">
                        Loading your account...
                    </p>
                </div>
            </main>
        );
    }

    const userName =
        session.user.name ??
        "User";

    const userEmail =
        session.user.email ??
        "";

    return (
        <main
            dir="ltr"
            className="min-h-screen bg-background text-foreground"
        >
            <div className="relative flex min-h-screen flex-col overflow-hidden">
                {/* Background */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl"/>

                    <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl"/>
                </div>

                {/* Header */}
                <header className="relative z-10 border-b bg-background/80 backdrop-blur-xl">
                    <div
                        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Brand */}
                        <div className="flex items-center gap-3">
                            <div
                                className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(37,99,235,0.20)]">
                                <span className="text-sm font-bold">
                                    M
                                </span>
                            </div>

                            <div className="flex flex-col leading-none">
                                <span className="text-sm font-bold tracking-tight">
                                    Mizan DZ
                                </span>

                                <span className="mt-1 text-[10px] text-muted-foreground">
                                    Business Management System
                                </span>
                            </div>
                        </div>

                        {/* Header Actions */}
                        <div className="flex items-center gap-2">
                            {/* Theme Toggle */}
                            <button
                                type="button"
                                onClick={
                                    toggleTheme
                                }
                                disabled={
                                    !mounted
                                }
                                aria-label={
                                    theme ===
                                    "dark"
                                        ? "Switch to light mode"
                                        : "Switch to dark mode"
                                }
                                title={
                                    theme ===
                                    "dark"
                                        ? "Switch to light mode"
                                        : "Switch to dark mode"
                                }
                                className="grid size-9 place-items-center rounded-xl border bg-card text-muted-foreground shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60"
                            >
                                {!mounted ? (
                                    <Monitor className="size-4"/>
                                ) : theme ===
                                "dark" ? (
                                    <Sun className="size-4"/>
                                ) : (
                                    <Moon className="size-4"/>
                                )}
                            </button>

                            {/* Account */}
                            <div
                                className="hidden items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm backdrop-blur-md transition-colors hover:bg-card sm:flex">
                                {/* Avatar */}
                                <div
                                    className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(37,99,235,0.18)]">
                                    <span className="text-xs font-bold">
                                        {getInitial(
                                            userName,
                                        )}
                                    </span>

                                    <span
                                        className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500"/>
                                </div>

                                {/* Information */}
                                <div className="min-w-0 max-w-48">
                                    <div className="flex items-center gap-1.5">
                                        <p className="truncate text-xs font-semibold tracking-tight text-foreground">
                                            {
                                                userName
                                            }
                                        </p>

                                        <span
                                            className="hidden rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary lg:inline-flex">
                                            Account
                                        </span>
                                    </div>

                                    <p className="mt-1 truncate text-[10px] leading-none text-muted-foreground">
                                        {
                                            userEmail
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Mobile Avatar */}
                            <div
                                className="flex size-9 items-center justify-center rounded-xl border bg-card text-xs font-semibold shadow-sm sm:hidden">
                                {getInitial(
                                    userName,
                                )}
                            </div>

                            {/* Logout */}
                            <button
                                type="button"
                                onClick={
                                    handleLogout
                                }
                                disabled={
                                    loggingOut
                                }
                                aria-label="Log out"
                                title={
                                    loggingOut
                                        ? "Logging out..."
                                        : "Log out"
                                }
                                className="grid size-9 place-items-center rounded-xl border bg-card text-muted-foreground shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <LogOut className="size-4"/>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="relative z-10 flex flex-1">
                    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                        {/* Progress */}
                        <div className="mx-auto mb-8 w-full max-w-3xl">
                            <div className="rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur sm:p-5">
                                <div className="flex items-center justify-between">
                                    {steps.map(
                                        (
                                            step,
                                            index,
                                        ) => (
                                            <div
                                                key={
                                                    step.id
                                                }
                                                className="flex flex-1 items-center"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={[
                                                            "flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                                                            index ===
                                                            0
                                                                ? "border-primary bg-primary text-primary-foreground"
                                                                : "border-muted bg-muted text-muted-foreground",
                                                        ].join(
                                                            " ",
                                                        )}
                                                    >
                                                        {index ===
                                                        0 ? (
                                                            <Check className="size-4"/>
                                                        ) : (
                                                            step.id
                                                        )}
                                                    </div>

                                                    <span
                                                        className={[
                                                            "hidden text-xs font-medium sm:inline",
                                                            index ===
                                                            0
                                                                ? "text-foreground"
                                                                : "text-muted-foreground",
                                                        ].join(
                                                            " ",
                                                        )}
                                                    >
                                                        {
                                                            step.title
                                                        }
                                                    </span>
                                                </div>

                                                {index !==
                                                    steps.length -
                                                    1 && (
                                                        <div className="mx-3 h-px flex-1 bg-border"/>
                                                    )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex flex-1 items-start justify-center">
                            <section className="w-full max-w-3xl">
                                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                                    {
                                        children
                                    }
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <footer
                            className="mx-auto mt-8 flex w-full max-w-3xl items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                            <ShieldCheck className="size-4 text-primary"/>

                            <span>
                                Your data is
                                protected
                                and securely
                                managed by
                                Mizan DZ
                            </span>
                        </footer>
                    </div>
                </div>
            </div>
        </main>
    );
}

function getInitial(
    name: string,
) {
    const value =
        name.trim();

    if (!value) {
        return "U";
    }

    return value
        .charAt(0)
        .toUpperCase();
}