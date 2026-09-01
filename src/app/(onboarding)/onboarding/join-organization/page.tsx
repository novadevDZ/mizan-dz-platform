"use client";

import Link from "next/link";

import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    Mail,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {authClient} from "@/src/lib/auth-client";

type Invitation = {
    id: string;
    organizationId?: string;
    organizationName?: string;
    inviterEmail?: string;
    role?: string;
    status?: string;
};

export default function JoinOrganizationPage() {
    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        loadingInvitations,
        setLoadingInvitations,
    ] = useState(false);

    const [
        invitations,
        setInvitations,
    ] = useState<Invitation[]>([]);

    const [
        error,
        setError,
    ] = useState("");

    const [
        emailNotVerified,
        setEmailNotVerified,
    ] = useState(false);

    async function loadInvitations() {
        setLoadingInvitations(true);
        setError("");

        try {
            /*
             * First verify the current session.
             */
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

            /*
             * Invitations require a verified email.
             *
             * IMPORTANT:
             * Do not call listUserInvitations()
             * before this check.
             */
            if (
                !session.user.emailVerified
            ) {
                setEmailNotVerified(
                    true,
                );

                return;
            }

            /*
             * Email is verified.
             * It is now safe to load invitations.
             */
            const {
                data,
                error: invitationError,
            } =
                await authClient.organization.listUserInvitations();

            if (
                invitationError
            ) {
                console.error(
                    "[JoinOrganization] Failed to load invitations",
                    invitationError,
                );

                setError(
                    invitationError.message ??
                    "We couldn't load your organization invitations.",
                );

                return;
            }

            setInvitations(
                Array.isArray(data)
                    ? data
                    : [],
            );
        } catch (error) {
            console.error(
                "[JoinOrganization] Failed to load invitations",
                error,
            );

            setError(
                "Something went wrong while loading your invitations.",
            );
        } finally {
            setLoadingInvitations(false);
        }
    }

    useEffect(() => {
        async function initialize() {
            setLoading(true);
            setError("");
            setEmailNotVerified(false);

            try {
                const {
                    data: session,
                    error: sessionError,
                } =
                    await authClient.getSession();

                if (
                    sessionError ||
                    !session
                ) {
                    window.location.assign(
                        "/login",
                    );

                    return;
                }

                /*
                 * Unverified accounts must verify
                 * their email before accessing
                 * organization invitations.
                 */
                // if (
                //     !session.user
                //         .emailVerified
                // ) {
                //     window.location.assign(
                //         "/verify-email",
                //     );
                //
                //     return;
                // }

                await loadInvitations();
            } catch (error) {
                console.error(
                    "[JoinOrganization] Initialization failed",
                    error,
                );

                setError(
                    "We couldn't initialize the organization invitation flow.",
                );
            } finally {
                setLoading(false);
            }
        }

        void initialize();
    }, []);

    async function handleRefresh() {
        await loadInvitations();
    }

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center p-6 sm:p-8">
                <div className="flex flex-col items-center text-center">
                    <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <RefreshCw className="size-5 animate-spin"/>
                    </div>

                    <p className="mt-4 text-sm font-medium text-foreground">
                        Checking your account...
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Preparing your organization invitations.
                    </p>
                </div>
            </div>
        );
    }

    if (emailNotVerified) {
        return (
            <div className="p-6 sm:p-8">
                <div className="flex flex-col items-center text-center">
                    <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Mail className="size-7"/>
                    </div>

                    <div className="mt-6">
                        <div
                            className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                            <ShieldCheck className="size-3.5"/>
                            Email verification required
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Verify your email first
                        </h1>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                            You need to verify your email address before you can view or accept organization
                            invitations.
                        </p>
                    </div>

                    <div
                        className="mt-6 w-full max-w-md rounded-xl border border-border bg-muted/40 px-4 py-4 text-left">
                        <div className="flex gap-3">
                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary"/>

                            <p className="text-xs leading-5 text-muted-foreground">
                                After verification, return to Mizan DZ and your available organization invitations will
                                be loaded automatically.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex w-full max-w-md flex-col gap-3">
                        <Link
                            href="/verify-email"
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                            <Mail className="size-4"/>
                            Verify email
                        </Link>

                        <Link
                            href="/onboarding"
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                            <ArrowLeft className="size-4"/>
                            Back to onboarding
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loadingInvitations) {
        return (
            <div className="flex min-h-[420px] items-center justify-center p-6 sm:p-8">
                <div className="flex flex-col items-center text-center">
                    <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <RefreshCw className="size-5 animate-spin"/>
                    </div>

                    <p className="mt-4 text-sm font-medium text-foreground">
                        Loading invitations...
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Checking for organization invitations.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div
                        className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                        <Building2 className="size-3.5"/>
                        Organization invitations
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Join an organization
                    </h1>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                        Review the organization invitations associated with your verified email address.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        void handleRefresh()
                    }
                    disabled={
                        loadingInvitations
                    }
                    aria-label="Refresh invitations"
                    title="Refresh invitations"
                    className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw
                        className={[
                            "size-4",
                            loadingInvitations
                                ? "animate-spin"
                                : "",
                        ].join(" ")}
                    />
                </button>
            </div>

            {error && (
                <div
                    role="alert"
                    aria-live="polite"
                    className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-sm font-medium text-red-600 dark:text-red-400"
                >
                    {error}
                </div>
            )}

            {!error &&
                invitations.length ===
                0 && (
                    <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
                        <div
                            className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                            <Building2 className="size-6"/>
                        </div>

                        <h2 className="mt-4 text-base font-semibold text-foreground">
                            No pending invitations
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                            There are currently no organization invitations associated with your account.
                        </p>

                        <Link
                            href="/onboarding"
                            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                            <ArrowLeft className="size-4"/>
                            Back to onboarding
                        </Link>
                    </div>
                )}

            {!error &&
                invitations.length >
                0 && (
                    <div className="mt-6 space-y-3">
                        {invitations.map(
                            (
                                invitation,
                            ) => (
                                <div
                                    key={
                                        invitation.id
                                    }
                                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                            <Building2 className="size-5"/>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h2 className="truncate text-sm font-semibold text-foreground">
                                                {
                                                    invitation.organizationName ??
                                                    "Organization invitation"
                                                }
                                            </h2>

                                            {invitation.inviterEmail && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Invited by{" "}
                                                    {
                                                        invitation.inviterEmail
                                                    }
                                                </p>
                                            )}

                                            {invitation.role && (
                                                <p className="mt-2 text-xs font-medium text-primary">
                                                    Role:{" "}
                                                    {
                                                        invitation.role
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <CheckCircle2 className="size-4 text-emerald-500"/>

                                            Pending invitation
                                        </div>

                                        <button
                                            type="button"
                                            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                                        >
                                            Accept invitation
                                        </button>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}
        </div>
    );
}