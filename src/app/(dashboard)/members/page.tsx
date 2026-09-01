"use client";

import {
    Mail,
    MoreHorizontal,
    Plus,
    RefreshCw,
    ShieldCheck,
    UserCheck,
    UserMinus,
    Users,
    UserPlus,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

/* ============================================================
   TYPES
============================================================ */

type Member = {
    id: string;
    userId: string;
    organizationId: string;
    authMemberId: string | null;
    role: string;
    createdAt: string;

    user?: {
        id: string;
        name: string | null;
        email: string | null;
        image?: string | null;
        phone?: string | null;
        ownerPromptShown?: boolean;
    } | null;
};

type Invitation = {
    id: string;
    organizationId: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    inviterId: string;
};

type MembersResponse = {
    success?: boolean;
    data?: {
        members?: Member[];
    };
    message?: string;
    error?:
        | string
        | {
        message?: string;
        code?: string;
    };
};

type PreEmployeesResponse = {
    success?: boolean;
    data?: {
        members?: Member[];
    };
    message?: string;
    error?:
        | string
        | {
        message?: string;
        code?: string;
    };
};

type InvitationsResponse = {
    success?: boolean;
    data?: {
        invitations?: Invitation[];
    };
    message?: string;
    error?:
        | string
        | {
        message?: string;
        code?: string;
    };
};

type InviteState =
    | "idle"
    | "submitting"
    | "success"
    | "error";

/* ============================================================
   PAGE
============================================================ */

export default function MembersPage() {
    const [members, setMembers] =
        useState<Member[]>([]);

    const [
        preEmployees,
        setPreEmployees,
    ] = useState<Member[]>([]);

    const [invitations, setInvitations] =
        useState<Invitation[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [
        inviteEmail,
        setInviteEmail,
    ] = useState("");

    const [
        inviteError,
        setInviteError,
    ] = useState<string | null>(null);

    const [
        inviteState,
        setInviteState,
    ] = useState<InviteState>("idle");

    const [
        cancellingInvitationId,
        setCancellingInvitationId,
    ] = useState<string | null>(null);

    const [
        openMenuId,
        setOpenMenuId,
    ] = useState<string | null>(null);

    /* ========================================================
       FETCH MEMBERS + PRE-EMPLOYEES + INVITATIONS
    ======================================================== */

    const loadData = useCallback(
        async (showRefresh = false) => {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);

            try {
                const [
                    membersResponse,
                    preEmployeesResponse,
                    invitationsResponse,
                ] = await Promise.all([
                    fetch("/api/members", {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            Accept:
                                "application/json",
                        },
                        cache: "no-store",
                    }),

                    fetch(
                        "/api/members/pre-employees",
                        {
                            method: "GET",
                            credentials: "include",
                            headers: {
                                Accept:
                                    "application/json",
                            },
                            cache: "no-store",
                        },
                    ),

                    fetch("/api/invitations", {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            Accept:
                                "application/json",
                        },
                        cache: "no-store",
                    }),
                ]);

                const membersResult =
                    await parseJsonResponse<MembersResponse>(
                        membersResponse,
                        "Members",
                    );

                const preEmployeesResult =
                    await parseJsonResponse<PreEmployeesResponse>(
                        preEmployeesResponse,
                        "Pre-employees",
                    );

                const invitationsResult =
                    await parseJsonResponse<InvitationsResponse>(
                        invitationsResponse,
                        "Invitations",
                    );

                if (
                    !membersResponse.ok
                ) {
                    throw new Error(
                        getApiErrorMessage(
                            membersResult,
                            `Failed to load members. (${membersResponse.status})`,
                        ),
                    );
                }

                if (
                    !preEmployeesResponse.ok
                ) {
                    throw new Error(
                        getApiErrorMessage(
                            preEmployeesResult,
                            `Failed to load people who want to work. (${preEmployeesResponse.status})`,
                        ),
                    );
                }

                if (
                    !invitationsResponse.ok
                ) {
                    throw new Error(
                        getApiErrorMessage(
                            invitationsResult,
                            `Failed to load invitations. (${invitationsResponse.status})`,
                        ),
                    );
                }

                const nextMembers =
                    membersResult.data
                        ?.members;

                const nextPreEmployees =
                    preEmployeesResult.data
                        ?.members;

                const nextInvitations =
                    invitationsResult.data
                        ?.invitations;

                if (
                    !Array.isArray(
                        nextMembers,
                    )
                ) {
                    console.error(
                        "[Members] Invalid members payload:",
                        membersResult,
                    );

                    throw new Error(
                        "The server returned an invalid members response.",
                    );
                }

                if (
                    !Array.isArray(
                        nextPreEmployees,
                    )
                ) {
                    console.error(
                        "[Members] Invalid pre-employees payload:",
                        preEmployeesResult,
                    );

                    throw new Error(
                        "The server returned an invalid pre-employees response.",
                    );
                }

                if (
                    !Array.isArray(
                        nextInvitations,
                    )
                ) {
                    console.error(
                        "[Members] Invalid invitations payload:",
                        invitationsResult,
                    );

                    throw new Error(
                        "The server returned an invalid invitations response.",
                    );
                }

                setMembers(
                    nextMembers,
                );

                setPreEmployees(
                    nextPreEmployees,
                );

                setInvitations(
                    nextInvitations,
                );
            } catch (error) {
                console.error(
                    "[Members] Failed to load data:",
                    error,
                );

                setMembers([]);
                setPreEmployees([]);
                setInvitations([]);

                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load members.",
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [],
    );

    useEffect(() => {
        void loadData();
    }, [loadData]);

    /* ========================================================
       DERIVED DATA
    ======================================================== */

    const pendingInvitations =
        useMemo(
            () =>
                invitations.filter(
                    (invitation) =>
                        invitation.status ===
                        "pending" &&
                        !isExpired(
                            invitation.expiresAt,
                        ),
                ),
            [invitations],
        );

    const employeeCount =
        useMemo(
            () =>
                members.filter(
                    (member) =>
                        member.role ===
                        "employee",
                ).length,
            [members],
        );

    const preEmployeeCount =
        preEmployees.length;

    /* ========================================================
       INVITE
    ======================================================== */

    async function handleInvite(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            inviteState ===
            "submitting"
        ) {
            return;
        }

        const email =
            inviteEmail
                .trim()
                .toLowerCase();

        if (!email) {
            setInviteState(
                "error",
            );

            setInviteError(
                "Email address is required.",
            );

            return;
        }

        setInviteState(
            "submitting",
        );

        setInviteError(null);

        try {
            const response =
                await fetch(
                    "/api/invitations",
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
                            email,
                        }),
                    },
                );

            const result =
                await parseJsonResponse<{
                    success?: boolean;
                    message?: string;
                    error?:
                        | string
                        | {
                        message?: string;
                        code?: string;
                    };
                }>(
                    response,
                    "Invitation",
                );

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(
                        result,
                        `Failed to send invitation. (${response.status})`,
                    ),
                );
            }

            setInviteEmail("");

            setInviteState(
                "success",
            );

            await loadData(true);

            window.setTimeout(() => {
                setInviteState(
                    "idle",
                );
            }, 3000);
        } catch (error) {
            console.error(
                "[Members] Invite failed:",
                error,
            );

            setInviteState(
                "error",
            );

            setInviteError(
                error instanceof Error
                    ? error.message
                    : "Failed to send invitation.",
            );
        }
    }

    /* ========================================================
       CANCEL INVITATION
    ======================================================== */

    async function handleCancelInvitation(
        invitationId: string,
    ) {
        if (
            cancellingInvitationId
        ) {
            return;
        }

        setCancellingInvitationId(
            invitationId,
        );

        setError(null);

        try {
            const response =
                await fetch(
                    "/api/invitations/cancel",
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
                await parseJsonResponse<{
                    success?: boolean;
                    message?: string;
                    error?:
                        | string
                        | {
                        message?: string;
                        code?: string;
                    };
                }>(
                    response,
                    "Cancel invitation",
                );

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(
                        result,
                        `Failed to cancel invitation. (${response.status})`,
                    ),
                );
            }

            setOpenMenuId(null);

            await loadData(true);
        } catch (error) {
            console.error(
                "[Members] Cancel invitation failed:",
                error,
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to cancel invitation.",
            );
        } finally {
            setCancellingInvitationId(
                null,
            );
        }
    }

    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <div className="mizan-page-enter space-y-6">
            {/* Header */}
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                        Team
                    </p>

                    <h1 className="mizan-page-title mt-1">
                        Members
                    </h1>

                    <p className="mizan-page-description">
                        Manage employees, people who want
                        to work, and pending invitations.
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            void loadData(
                                true,
                            )
                        }
                        disabled={
                            refreshing
                        }
                        className="mizan-ghost-action px-3"
                        aria-label="Refresh members"
                    >
                        <RefreshCw
                            className={
                                refreshing
                                    ? "h-4 w-4 animate-spin"
                                    : "h-4 w-4"
                            }
                        />
                    </button>

                    <a
                        href="#invite-member"
                        className="mizan-primary-action"
                    >
                        <Plus className="h-4 w-4"/>

                        <span className="ml-2">
                            Invite employee
                        </span>
                    </a>
                </div>
            </section>

            {/* Summary */}
            <section className="grid gap-4 sm:grid-cols-4">
                <SummaryCard
                    icon={
                        <Users className="h-4 w-4"/>
                    }
                    label="Total members"
                    value={
                        loading
                            ? "—"
                            : String(
                                members.length,
                            )
                    }
                />

                <SummaryCard
                    icon={
                        <UserCheck className="h-4 w-4"/>
                    }
                    label="Employees"
                    value={
                        loading
                            ? "—"
                            : String(
                                employeeCount,
                            )
                    }
                />

                <SummaryCard
                    icon={
                        <UserPlus className="h-4 w-4"/>
                    }
                    label="People who want to work"
                    value={
                        loading
                            ? "—"
                            : String(
                                preEmployeeCount,
                            )
                    }
                />

                <SummaryCard
                    icon={
                        <Mail className="h-4 w-4"/>
                    }
                    label="Pending invitations"
                    value={
                        loading
                            ? "—"
                            : String(
                                pendingInvitations.length,
                            )
                    }
                />
            </section>

            {/* Error */}
            {error ? (
                <section
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            {error}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                void loadData()
                            }
                            className="font-semibold underline underline-offset-2"
                        >
                            Retry
                        </button>
                    </div>
                </section>
            ) : null}

            {/* Invite */}
            <section
                id="invite-member"
                className="mizan-card scroll-mt-6 p-5 sm:p-6"
            >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--text-primary)]">
                            Invite an employee
                        </p>

                        <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
                            Send a secure Better Auth invitation.
                            The employee will receive access after
                            accepting the invitation.
                        </p>
                    </div>

                    <form
                        onSubmit={
                            handleInvite
                        }
                        className="w-full lg:max-w-xl"
                    >
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <label
                                htmlFor="invite-email"
                                className="sr-only"
                            >
                                Employee email
                            </label>

                            <input
                                id="invite-email"
                                name="invite-email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                value={
                                    inviteEmail
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setInviteEmail(
                                        event.target
                                            .value,
                                    );

                                    if (
                                        inviteState ===
                                        "error"
                                    ) {
                                        setInviteState(
                                            "idle",
                                        );

                                        setInviteError(
                                            null,
                                        );
                                    }
                                }}
                                placeholder="employee@example.com"
                                className="h-10 min-w-0 flex-1"
                                required
                                disabled={
                                    inviteState ===
                                    "submitting"
                                }
                            />

                            <button
                                type="submit"
                                disabled={
                                    inviteState ===
                                    "submitting"
                                }
                                className="mizan-primary-action shrink-0 justify-center disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {inviteState ===
                                "submitting" ? (
                                    <span
                                        aria-hidden="true"
                                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                    />
                                ) : (
                                    <Mail className="h-4 w-4"/>
                                )}

                                <span className="ml-2">
                                    {inviteState ===
                                    "submitting"
                                        ? "Sending..."
                                        : "Send invitation"}
                                </span>
                            </button>
                        </div>

                        {inviteState ===
                        "error" &&
                        inviteError ? (
                            <p
                                role="alert"
                                className="mt-2 text-xs font-medium text-[var(--danger)]"
                            >
                                {
                                    inviteError
                                }
                            </p>
                        ) : null}

                        {inviteState ===
                        "success" ? (
                            <p
                                role="status"
                                className="mt-2 text-xs font-semibold text-emerald-700"
                            >
                                Invitation sent
                                successfully.
                            </p>
                        ) : null}
                    </form>
                </div>
            </section>

            {/* Team Members */}
            <section className="mizan-dashboard-section overflow-hidden">
                <div
                    className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-4 sm:px-5">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">
                            Team members
                        </h2>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            People with active access to this organization.
                        </p>
                    </div>

                    <span className="text-xs text-[var(--text-muted)]">
                        {loading
                            ? "Loading..."
                            : `${members.length} member${
                                members.length ===
                                1
                                    ? ""
                                    : "s"
                            }`}
                    </span>
                </div>

                {loading ? (
                    <MembersLoading/>
                ) : members.length ===
                0 ? (
                    <MembersEmpty/>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="mizan-table min-w-[900px]">
                                <thead>
                                <tr>
                                    <th>
                                        Member
                                    </th>
                                    <th>
                                        Role
                                    </th>
                                    <th>
                                        Status
                                    </th>
                                    <th>
                                        Joined
                                    </th>
                                    <th className="text-right">
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {members.map(
                                    (
                                        member,
                                    ) => {
                                        const name =
                                            member
                                                .user
                                                ?.name
                                                ?.trim() ||
                                            "Unknown user";

                                        const email =
                                            member
                                                .user
                                                ?.email
                                                ?.trim() ||
                                            "—";

                                        return (
                                            <tr
                                                key={
                                                    member.id
                                                }
                                            >
                                                <td>
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <MemberAvatar
                                                            name={
                                                                name
                                                            }
                                                        />

                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-[var(--text-primary)]">
                                                                {
                                                                    name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                                                                {
                                                                    email
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <MemberRoleBadge
                                                        role={
                                                            member.role
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <StatusBadge status="active"/>
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        member.createdAt,
                                                    )}
                                                </td>

                                                <td className="text-right">
                                                    <MemberActions
                                                        member={
                                                            member
                                                        }
                                                        openMenuId={
                                                            openMenuId
                                                        }
                                                        setOpenMenuId={
                                                            setOpenMenuId
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    },
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="divide-y divide-[var(--border-soft)] md:hidden">
                            {members.map(
                                (
                                    member,
                                ) => {
                                    const name =
                                        member
                                            .user
                                            ?.name
                                            ?.trim() ||
                                        "Unknown user";

                                    const email =
                                        member
                                            .user
                                            ?.email
                                            ?.trim() ||
                                        "—";

                                    return (
                                        <div
                                            key={
                                                member.id
                                            }
                                            className="p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <MemberAvatar
                                                    name={
                                                        name
                                                    }
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                                {
                                                                    name
                                                                }
                                                            </p>

                                                            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                                                                {
                                                                    email
                                                                }
                                                            </p>
                                                        </div>

                                                        <MemberActions
                                                            member={
                                                                member
                                                            }
                                                            openMenuId={
                                                                openMenuId
                                                            }
                                                            setOpenMenuId={
                                                                setOpenMenuId
                                                            }
                                                        />
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        <MemberRoleBadge
                                                            role={
                                                                member.role
                                                            }
                                                        />

                                                        <StatusBadge status="active"/>

                                                        <span className="text-[11px] text-[var(--text-muted)]">
                                                            Joined{" "}
                                                            {formatDate(
                                                                member.createdAt,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </>
                )}
            </section>

            {/* People Who Want to Work */}
            <section className="mizan-dashboard-section overflow-hidden">
                <div
                    className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-4 sm:px-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                People Who Want to Work
                            </h2>

                            {!loading &&
                            preEmployees.length >
                            0 ? (
                                <span
                                    className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--mizan-blue-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                                    {
                                        preEmployees.length
                                    }
                                </span>
                            ) : null}
                        </div>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            People who have chosen to work with this organization
                            but are not active employees yet.
                        </p>
                    </div>

                    <span className="text-xs text-[var(--text-muted)]">
                        {loading
                            ? "Loading..."
                            : `${preEmployees.length} person${
                                preEmployees.length ===
                                1
                                    ? ""
                                    : "s"
                            }`}
                    </span>
                </div>

                {loading ? (
                    <PreEmployeesLoading/>
                ) : preEmployees.length ===
                0 ? (
                    <PreEmployeesEmpty/>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="mizan-table min-w-[850px]">
                                <thead>
                                <tr>
                                    <th>
                                        Person
                                    </th>
                                    <th>
                                        Status
                                    </th>
                                    <th>
                                        Joined
                                    </th>
                                    <th>
                                        Email
                                    </th>
                                    <th className="text-right">
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {preEmployees.map(
                                    (
                                        member,
                                    ) => {
                                        const name =
                                            member
                                                .user
                                                ?.name
                                                ?.trim() ||
                                            "Unknown user";

                                        const email =
                                            member
                                                .user
                                                ?.email
                                                ?.trim() ||
                                            "—";

                                        return (
                                            <tr
                                                key={
                                                    member.id
                                                }
                                            >
                                                <td>
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <MemberAvatar
                                                            name={
                                                                name
                                                            }
                                                        />

                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-[var(--text-primary)]">
                                                                {
                                                                    name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                                                Interested in joining
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <PreEmployeeBadge/>
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        member.createdAt,
                                                    )}
                                                </td>

                                                <td>
                                                    <p className="truncate text-xs text-[var(--text-muted)]">
                                                        {
                                                            email
                                                        }
                                                    </p>
                                                </td>

                                                <td className="text-right">
                                                    <button
                                                        type="button"
                                                        className="mizan-primary-action"
                                                    >
                                                        <UserCheck className="h-4 w-4"/>

                                                        <span className="ml-2">
                                                                Review
                                                            </span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    },
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="divide-y divide-[var(--border-soft)] md:hidden">
                            {preEmployees.map(
                                (
                                    member,
                                ) => {
                                    const name =
                                        member
                                            .user
                                            ?.name
                                            ?.trim() ||
                                        "Unknown user";

                                    const email =
                                        member
                                            .user
                                            ?.email
                                            ?.trim() ||
                                        "—";

                                    return (
                                        <div
                                            key={
                                                member.id
                                            }
                                            className="p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <MemberAvatar
                                                    name={
                                                        name
                                                    }
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                                {
                                                                    name
                                                                }
                                                            </p>

                                                            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                                                                {
                                                                    email
                                                                }
                                                            </p>
                                                        </div>

                                                        <PreEmployeeBadge/>
                                                    </div>

                                                    <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                                                        Wants to work with this organization
                                                    </p>

                                                    <div className="mt-3 flex items-center justify-between gap-3">
                                                        <span className="text-[11px] text-[var(--text-muted)]">
                                                            Added{" "}
                                                            {formatDate(
                                                                member.createdAt,
                                                            )}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            className="mizan-primary-action px-3"
                                                        >
                                                            <UserCheck className="h-4 w-4"/>

                                                            <span className="ml-2">
                                                                Review
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </>
                )}
            </section>

            {/* Pending invitations */}
            <section className="mizan-dashboard-section overflow-hidden">
                <div
                    className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-4 sm:px-5">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">
                            Pending invitations
                        </h2>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Invitations that have not been accepted yet.
                        </p>
                    </div>

                    <span className="text-xs text-[var(--text-muted)]">
                        {
                            pendingInvitations.length
                        }{" "}
                        pending
                    </span>
                </div>

                {loading ? (
                    <InvitationsLoading/>
                ) : pendingInvitations.length ===
                0 ? (
                    <InvitationsEmpty/>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="mizan-table min-w-[850px]">
                                <thead>
                                <tr>
                                    <th>
                                        Email
                                    </th>
                                    <th>
                                        Role
                                    </th>
                                    <th>
                                        Status
                                    </th>
                                    <th>
                                        Expires
                                    </th>
                                    <th className="text-right">
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {pendingInvitations.map(
                                    (
                                        invitation,
                                    ) => (
                                        <tr
                                            key={
                                                invitation.id
                                            }
                                        >
                                            <td>
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div
                                                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                                                        <Mail className="h-4 w-4"/>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-[var(--text-primary)]">
                                                            {
                                                                invitation.email
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                                            Invitation pending
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <MemberRoleBadge
                                                    role={
                                                        invitation.role
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <StatusBadge status="pending"/>
                                            </td>

                                            <td>
                                                {formatDate(
                                                    invitation.expiresAt,
                                                )}
                                            </td>

                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleCancelInvitation(
                                                            invitation.id,
                                                        )
                                                    }
                                                    disabled={
                                                        cancellingInvitationId ===
                                                        invitation.id
                                                    }
                                                    className="text-xs font-semibold text-[var(--danger)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {cancellingInvitationId ===
                                                    invitation.id
                                                        ? "Cancelling..."
                                                        : "Cancel"}
                                                </button>
                                            </td>
                                        </tr>
                                    ),
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="divide-y divide-[var(--border-soft)] md:hidden">
                            {pendingInvitations.map(
                                (
                                    invitation,
                                ) => (
                                    <div
                                        key={
                                            invitation.id
                                        }
                                        className="p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                                                <Mail className="h-4 w-4"/>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                            {
                                                                invitation.email
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                            Expires{" "}
                                                            {formatDate(
                                                                invitation.expiresAt,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <StatusBadge status="pending"/>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between gap-3">
                                                    <MemberRoleBadge
                                                        role={
                                                            invitation.role
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleCancelInvitation(
                                                                invitation.id,
                                                            )
                                                        }
                                                        disabled={
                                                            cancellingInvitationId ===
                                                            invitation.id
                                                        }
                                                        className="text-xs font-semibold text-[var(--danger)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {cancellingInvitationId ===
                                                        invitation.id
                                                            ? "Cancelling..."
                                                            : "Cancel"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

/* ============================================================
   COMPONENTS
============================================================ */

function SummaryCard({
                         icon,
                         label,
                         value,
                     }: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <section className="mizan-card p-4">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                        {label}
                    </p>

                    <p className="mt-1 text-2xl font-black tracking-tight text-[var(--text-primary)]">
                        {value}
                    </p>
                </div>

                <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                    {icon}
                </div>
            </div>
        </section>
    );
}

function MemberAvatar({
                          name,
                      }: {
    name: string;
}) {
    const initials =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) =>
                part.charAt(0),
            )
            .join("")
            .toUpperCase() ||
        "U";

    return (
        <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-xs font-bold text-[var(--primary)]">
            {initials}
        </div>
    );
}

function MemberRoleBadge({
                             role,
                         }: {
    role: string;
}) {
    const isOwner =
        role === "owner";

    return (
        <span
            className={
                isOwner
                    ? "inline-flex items-center gap-1.5 rounded-full bg-[var(--mizan-blue-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]"
                    : "inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)]"
            }
        >
            {isOwner ? (
                <ShieldCheck className="h-3 w-3"/>
            ) : (
                <UserCheck className="h-3 w-3"/>
            )}

            {isOwner
                ? "Owner"
                : "Employee"}
        </span>
    );
}

function PreEmployeeBadge() {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <UserPlus className="h-3 w-3"/>
            Wants to work
        </span>
    );
}

function StatusBadge({
                         status,
                     }: {
    status:
        | "active"
        | "pending";
}) {
    if (status === "pending") {
        return (
            <span
                className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Pending
            </span>
        );
    }

    return (
        <span
            className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Active
        </span>
    );
}

function MemberActions({
                           member,
                           openMenuId,
                           setOpenMenuId,
                       }: {
    member: Member;
    openMenuId: string | null;
    setOpenMenuId: (
        value: string | null,
    ) => void;
}) {
    const isOwner =
        member.role === "owner";

    const isOpen =
        openMenuId === member.id;

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={() =>
                    setOpenMenuId(
                        isOpen
                            ? null
                            : member.id,
                    )
                }
                className="mizan-ghost-action h-9 w-9 px-0"
                aria-label={`Actions for ${
                    member.user?.name ??
                    "member"
                }`}
                aria-expanded={
                    isOpen
                }
                aria-haspopup="menu"
            >
                <MoreHorizontal className="h-4 w-4"/>
            </button>

            {isOpen ? (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-30 mt-2 w-44 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-1.5 shadow-xl"
                >
                    <button
                        type="button"
                        role="menuitem"
                        disabled={
                            isOwner
                        }
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() =>
                            setOpenMenuId(
                                null,
                            )
                        }
                    >
                        <UserMinus className="mr-2 h-4 w-4"/>
                        Remove member
                    </button>
                </div>
            ) : null}
        </div>
    );
}

function MembersLoading() {
    return (
        <div
            className="space-y-1 p-3"
            aria-busy="true"
        >
            {Array.from({
                length: 5,
            }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl p-3"
                >
                    <div className="mizan-skeleton h-10 w-10 shrink-0 rounded-xl"/>

                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="mizan-skeleton h-3 w-40 rounded"/>
                        <div className="mizan-skeleton h-2.5 w-28 rounded"/>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PreEmployeesLoading() {
    return (
        <div
            className="space-y-1 p-3"
            aria-busy="true"
        >
            {Array.from({
                length: 3,
            }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl p-3"
                >
                    <div className="mizan-skeleton h-10 w-10 shrink-0 rounded-xl"/>

                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="mizan-skeleton h-3 w-40 rounded"/>
                        <div className="mizan-skeleton h-2.5 w-32 rounded"/>
                    </div>
                </div>
            ))}
        </div>
    );
}

function InvitationsLoading() {
    return (
        <div
            className="space-y-1 p-3"
            aria-busy="true"
        >
            {Array.from({
                length: 3,
            }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl p-3"
                >
                    <div className="mizan-skeleton h-9 w-9 shrink-0 rounded-xl"/>

                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="mizan-skeleton h-3 w-48 rounded"/>
                        <div className="mizan-skeleton h-2.5 w-24 rounded"/>
                    </div>
                </div>
            ))}
        </div>
    );
}

function MembersEmpty() {
    return (
        <div className="mizan-empty min-h-[320px]">
            <div className="mizan-empty-icon">
                <Users className="h-5 w-5"/>
            </div>

            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                No members yet
            </h2>

            <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
                Your organization does not have any
                active members yet.
            </p>

            <a
                href="#invite-member"
                className="mizan-primary-action mt-5"
            >
                <Plus className="h-4 w-4"/>

                <span className="ml-2">
                    Invite employee
                </span>
            </a>
        </div>
    );
}

function PreEmployeesEmpty() {
    return (
        <div className="mizan-empty min-h-[260px]">
            <div className="mizan-empty-icon">
                <UserPlus className="h-5 w-5"/>
            </div>

            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                No people yet
            </h2>

            <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
                People who choose to work with your
                organization will appear here.
            </p>
        </div>
    );
}

function InvitationsEmpty() {
    return (
        <div className="mizan-empty min-h-[260px]">
            <div className="mizan-empty-icon">
                <Mail className="h-5 w-5"/>
            </div>

            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                No pending invitations
            </h2>

            <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
                Invitations waiting for acceptance
                will appear here.
            </p>
        </div>
    );
}

/* ============================================================
   API HELPERS
============================================================ */

async function parseJsonResponse<T>(
    response: Response,
    label: string,
): Promise<T> {
    const text =
        await response.text();

    if (!text.trim()) {
        throw new Error(
            `${label} API returned an empty response. (${response.status})`,
        );
    }

    try {
        return JSON.parse(
            text,
        ) as T;
    } catch (error) {
        console.error(
            `[Members] ${label} API returned invalid JSON:`,
            {
                status:
                response.status,
                statusText:
                response.statusText,
                body: text.slice(
                    0,
                    1000,
                ),
                error,
            },
        );

        throw new Error(
            `${label} API returned invalid JSON. (${response.status})`,
        );
    }
}

function getApiErrorMessage(
    result: {
        message?: string;
        error?:
            | string
            | {
            message?: string;
            code?: string;
        };
    },
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
            .message ===
        "string"
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

/* ============================================================
   DATE HELPERS
============================================================ */

function isExpired(
    value: string,
) {
    const timestamp =
        new Date(
            value,
        ).getTime();

    if (
        Number.isNaN(
            timestamp,
        )
    ) {
        return true;
    }

    return (
        timestamp <=
        Date.now()
    );
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