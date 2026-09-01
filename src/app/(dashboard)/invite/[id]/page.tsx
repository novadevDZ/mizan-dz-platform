"use client";

import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock3,
    Mail,
    ShieldCheck,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
    useEffect,
    useMemo,
    useState,
} from "react";
import Link from "next/link";

type Invitation = {
    id: string;
    organizationId: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    inviterId: string;
};

type SessionUser = {
    id: string;
    name?: string | null;
    email?: string | null;
};

type Session = {
    user: SessionUser;
};

type ApiResponse<T = unknown> = {
    data?: T;
    message?: string;
    error?:
        | string
        | {
        message?: string;
    };
};

type InvitationResponse = {
    invitation: Invitation;
};

type SessionResponse = {
    user: SessionUser;
};

export default function InvitationPage() {
    const params =
        useParams<{
            id: string;
        }>();

    const router = useRouter();

    const invitationId =
        params.id;

    const [invitation, setInvitation] =
        useState<Invitation | null>(
            null,
        );

    const [sessionUser, setSessionUser] =
        useState<SessionUser | null>(
            null,
        );

    const [loading, setLoading] =
        useState(true);

    const [accepting, setAccepting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(
            null,
        );

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            try {
                const [
                    invitationResponse,
                    sessionResponse,
                ] =
                    await Promise.all([
                        fetch(
                            `/api/invitations/${invitationId}`,
                            {
                                method:
                                    "GET",
                                credentials:
                                    "include",
                                headers: {
                                    Accept:
                                        "application/json",
                                },
                                cache:
                                    "no-store",
                            },
                        ),

                        fetch(
                            "/api/auth/session",
                            {
                                method:
                                    "GET",
                                credentials:
                                    "include",
                                headers: {
                                    Accept:
                                        "application/json",
                                },
                                cache:
                                    "no-store",
                            },
                        ),
                    ]);

                const invitationResult =
                    (await invitationResponse.json()) as ApiResponse<InvitationResponse>;

                if (
                    !invitationResponse.ok
                ) {
                    throw new Error(
                        getApiErrorMessage(
                            invitationResult,
                            "Unable to load invitation.",
                        ),
                    );
                }

                let nextUser:
                    | SessionUser
                    | null = null;

                if (
                    sessionResponse.ok
                ) {
                    const sessionResult =
                        (await sessionResponse.json()) as ApiResponse<SessionResponse>;

                    nextUser =
                        sessionResult
                            .data
                            ?.user ??
                        null;
                }

                if (
                    cancelled
                ) {
                    return;
                }

                setInvitation(
                    invitationResult
                        .data
                        ?.invitation ??
                    null,
                );

                setSessionUser(
                    nextUser,
                );
            } catch (error) {
                if (
                    cancelled
                ) {
                    return;
                }

                console.error(
                    "[Invitation]",
                    error,
                );

                setError(
                    error instanceof
                    Error
                        ? error.message
                        : "Unable to load invitation.",
                );
            } finally {
                if (
                    !cancelled
                ) {
                    setLoading(
                        false,
                    );
                }
            }
        }

        if (
            invitationId
        ) {
            void load();
        }

        return () => {
            cancelled = true;
        };
    }, [invitationId]);

    const expired =
        useMemo(() => {
            if (
                !invitation
            ) {
                return false;
            }

            const time =
                new Date(
                    invitation.expiresAt,
                ).getTime();

            return (
                Number.isNaN(time) ||
                time <=
                Date.now()
            );
        }, [invitation]);

    const handled =
        invitation
            ? invitation.status !==
            "pending"
            : false;

    const emailMatches =
        Boolean(
            sessionUser?.email &&
            invitation?.email &&
            sessionUser.email
                .trim()
                .toLowerCase() ===
            invitation.email
                .trim()
                .toLowerCase(),
        );

    async function handleAccept() {
        setAccepting(true);
        setError(null);

        try {
            const response =
                await fetch(
                    "/api/invitations/accept",
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                        },
                        body: JSON.stringify({
                            invitationId,
                        }),
                    },
                );

            const result =
                (await response.json()) as ApiResponse;

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(
                        result,
                        "Unable to accept invitation.",
                    ),
                );
            }

            router.replace(
                "/dashboard",
            );

            router.refresh();
        } catch (error) {
            console.error(
                "[Invitation] Accept",
                error,
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to accept invitation.",
            );
        } finally {
            setAccepting(false);
        }
    }

    if (loading) {
        return (
            <InvitationShell>
                <InvitationLoading />
            </InvitationShell>
        );
    }

    if (
        error &&
        !invitation
    ) {
        return (
            <InvitationShell>
                <InvitationError
                    message={error}
                />
            </InvitationShell>
        );
    }

    if (!invitation) {
        return (
            <InvitationShell>
                <InvitationError
                    message="Invitation not found."
                />
            </InvitationShell>
        );
    }

    if (
        expired ||
        handled
    ) {
        return (
            <InvitationShell>
                <div className="mx-auto w-full max-w-md">
                    <div className="mizan-card p-6 text-center sm:p-8">
                        <div className="mizan-empty">
                            <div className="mizan-empty-icon">
                                <Clock3 className="h-5 w-5" />
                            </div>

                            <h1 className="text-xl font-bold text-[var(--text-primary)]">
                                Invitation unavailable
                            </h1>

                            <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">
                                {expired
                                    ? "This invitation has expired."
                                    : `This invitation is ${invitation.status}.`}
                            </p>

                            <a
                                href="/"
                                className="mizan-primary-action mt-5"
                            >
                                Go back
                            </a>
                        </div>
                    </div>
                </div>
            </InvitationShell>
        );
    }

    return (
        <InvitationShell>
            <div className="mx-auto w-full max-w-xl">
                <section className="mizan-card overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-[var(--border-soft)] p-6 sm:p-8">
                        <div className="mx-auto flex max-w-md flex-col items-center text-center">
                            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                                <Mail className="h-6 w-6" />
                            </div>

                            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                                Team invitation
                            </p>

                            <h1 className="mizan-page-title mt-1">
                                You're invited
                            </h1>

                            <p className="mizan-page-description mt-2">
                                Join your organization on
                                Mizan DZ.
                            </p>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-5 p-6 sm:p-8">
                        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-secondary)] p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <InvitationInfo
                                    label="Invited email"
                                    value={
                                        invitation.email
                                    }
                                />

                                <InvitationInfo
                                    label="Role"
                                    value="Employee"
                                />

                                <InvitationInfo
                                    label="Expires"
                                    value={formatDate(
                                        invitation.expiresAt,
                                    )}
                                />

                                <InvitationInfo
                                    label="Status"
                                    value="Pending"
                                />
                            </div>
                        </div>

                        {!sessionUser ? (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-amber-500/20 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-amber-900">
                                                Sign in to continue
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-amber-800">
                                                Sign in using{" "}
                                                <strong>
                                                    {
                                                        invitation.email
                                                    }
                                                </strong>{" "}
                                                to accept this
                                                invitation.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <a
                                    href={`/login?callbackUrl=${encodeURIComponent(
                                        `/invite/${invitationId}`,
                                    )}`}
                                    className="mizan-primary-action w-full justify-center"
                                >
                                    <span>
                                        Sign in
                                    </span>

                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </a>
                            </div>
                        ) : !emailMatches ? (
                            <WrongAccountState
                                invitationEmail={
                                    invitation.email
                                }
                                currentEmail={
                                    sessionUser.email ??
                                    ""
                                }
                            />
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-emerald-900">
                                                Invitation ready
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-emerald-800">
                                                You are signed in
                                                with the invited
                                                email.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {error ? (
                                    <div
                                        role="alert"
                                        className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"
                                    >
                                        {error}
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={
                                        handleAccept
                                    }
                                    disabled={
                                        accepting
                                    }
                                    className="mizan-primary-action w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ShieldCheck className="h-4 w-4" />

                                    <span className="ml-2">
                                        {accepting
                                            ? "Joining..."
                                            : "Accept invitation"}
                                    </span>
                                </button>
                            </div>
                        )}

                        <p className="text-center text-[11px] leading-5 text-[var(--text-muted)]">
                            By accepting this invitation,
                            you will become an employee
                            member of this organization.
                        </p>
                    </div>
                </section>
            </div>
        </InvitationShell>
    );
}

function InvitationShell({
                             children,
                         }: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen bg-[var(--surface-secondary)] px-4 py-8 sm:px-6 sm:py-12">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
                <div className="w-full">
                    <div className="mb-6 flex justify-center">
                        <Link
                            href="/"
                            className="text-lg font-black tracking-tight text-[var(--text-primary)]"
                        >
                            Mizan
                            <span className="text-[var(--primary)]">
                                DZ
                            </span>
                        </Link>
                    </div>

                    {children}
                </div>
            </div>
        </main>
    );
}

function InvitationInfo({
                            label,
                            value,
                        }: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {label}
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
                {value}
            </p>
        </div>
    );
}

function WrongAccountState({
                               invitationEmail,
                               currentEmail,
                           }: {
    invitationEmail: string;
    currentEmail: string;
}) {
    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" />

                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--danger)]">
                            Wrong account
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                            This invitation belongs
                            to{" "}
                            <strong>
                                {
                                    invitationEmail
                                }
                            </strong>
                            .
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                            Current account:{" "}
                            <strong>
                                {
                                    currentEmail
                                }
                            </strong>
                        </p>
                    </div>
                </div>
            </div>

            <a
                href={`/login?callbackUrl=${encodeURIComponent(
                    window.location.pathname,
                )}`}
                className="mizan-ghost-action w-full justify-center"
            >
                Use another account
            </a>
        </div>
    );
}

function InvitationLoading() {
    return (
        <div className="mx-auto w-full max-w-xl">
            <div className="mizan-card p-6 sm:p-8">
                <div className="space-y-5">
                    <div className="mx-auto mizan-skeleton h-14 w-14 rounded-2xl" />

                    <div className="mx-auto mizan-skeleton h-3 w-28 rounded" />

                    <div className="mx-auto mizan-skeleton h-7 w-48 rounded" />

                    <div className="mx-auto mizan-skeleton h-3 w-64 rounded" />

                    <div className="mizan-skeleton h-28 rounded-xl" />

                    <div className="mizan-skeleton h-10 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

function InvitationError({
                             message,
                         }: {
    message: string;
}) {
    return (
        <div className="mx-auto w-full max-w-md">
            <div
                role="alert"
                className="mizan-card p-6 text-center sm:p-8"
            >
                <div className="mizan-empty">
                    <div className="mizan-empty-icon">
                        <AlertCircle className="h-5 w-5" />
                    </div>

                    <h1 className="text-xl font-bold text-[var(--text-primary)]">
                        Unable to load invitation
                    </h1>

                    <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">
                        {message}
                    </p>

                    <a
                        href="/"
                        className="mizan-primary-action mt-5"
                    >
                        Go back
                    </a>
                </div>
            </div>
        </div>
    );
}

function getApiErrorMessage(
    result: ApiResponse,
    fallback: string,
) {
    if (
        typeof result.error ===
        "string"
    ) {
        return result.error;
    }

    if (
        result.error &&
        typeof result.error ===
        "object" &&
        typeof result.error
            .message === "string"
    ) {
        return result.error
            .message;
    }

    if (
        typeof result.message ===
        "string"
    ) {
        return result.message;
    }

    return fallback;
}

function formatDate(
    value: string,
) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-DZ",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        },
    ).format(date);
}