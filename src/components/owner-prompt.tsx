"use client";

import {
    Building2,
    ChevronRight,
    Clock3,
    ShieldCheck,
} from "lucide-react";

import {
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

type OwnerPromptProps = {
    userName?: string | null;
};

export default function OwnerPrompt({
                                        userName,
                                    }: OwnerPromptProps) {
    const router = useRouter();

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    async function handleLater() {
        if (loading) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response =
                await fetch(
                    "/api/onboarding/owner-prompt",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            action: "later",
                        }),
                    },
                );

            const data =
                await response
                    .json()
                    .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.message ??
                    `Request failed with status ${response.status}`,
                );
            }

            router.replace(
                "/onboarding/professional-profile",
            );

            router.refresh();
        } catch (error) {
            console.error(
                "[OwnerPrompt] Failed to continue later:",
                error,
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again.",
            );

            setLoading(false);
        }
    }

    function handleBecomeOwner() {
        if (loading) {
            return;
        }

        router.push(
            "/onboarding/create-organization",
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="border-b border-border px-6 py-8 sm:px-8 sm:py-10">
                <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <ShieldCheck className="size-5"/>
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                            Mizan DZ
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Account setup
                        </p>
                    </div>
                </div>

                <div className="mt-7">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Welcome
                        {userName
                            ? `, ${userName}`
                            : ""}
                    </h1>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                        Your account is ready.
                        Choose how you want to
                        continue with Mizan DZ.
                    </p>
                </div>
            </div>

            {/* Options */}
            <div className="space-y-4 p-6 sm:p-8">
                {/* Owner */}
                <button
                    type="button"
                    onClick={
                        handleBecomeOwner
                    }
                    disabled={loading}
                    className="group w-full rounded-2xl border border-border bg-background p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                    <div className="flex items-start gap-4">
                        <div
                            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <Building2 className="size-5"/>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Become a Business Owner
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Create your
                                        organization and
                                        manage your
                                        business with
                                        Mizan DZ.
                                    </p>
                                </div>

                                <ChevronRight
                                    className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"/>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span
                                    className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                                    Create organization
                                </span>

                                <span
                                    className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                                    Owner access
                                </span>
                            </div>
                        </div>
                    </div>
                </button>

                {/* Later */}
                <button
                    type="button"
                    onClick={
                        handleLater
                    }
                    disabled={loading}
                    className="group w-full rounded-2xl border border-border bg-card p-5 text-left transition-all duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                    <div className="flex items-start gap-4">
                        <div
                            className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                            <Clock3 className="size-5"/>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Maybe later
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Continue setting
                                        up your personal
                                        profile and
                                        explore Mizan DZ
                                        first.
                                    </p>
                                </div>

                                <ChevronRight
                                    className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"/>
                            </div>
                        </div>
                    </div>
                </button>

                {/* Error */}
                {error && (
                    <div
                        role="alert"
                        aria-live="polite"
                        className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3.5 text-sm font-medium text-destructive"
                    >
                        {error}
                    </div>
                )}

                {/* Footer Note */}
                <div className="flex items-start gap-2 rounded-xl bg-muted/40 px-4 py-3.5">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary"/>

                    <p className="text-xs leading-5 text-muted-foreground">
                        You can create an organization
                        later. Your decision here does
                        not remove your account or
                        organization invitations.
                    </p>
                </div>
            </div>
        </div>
    );
}