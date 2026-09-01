"use client";

import {
    FormEvent,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import Link from "next/link";
import {
    Building2,
    Check,
    ChevronLeft,
    Copy,
    Image as ImageIcon,
    Loader2,
    Save,
    ShieldCheck,
    Trash2,
    Users,
} from "lucide-react";

type Organization = {
    id: string;
    authOrganizationId: string;
    name: string;
    phone: string;
    address: string | null;
    wilaya: string;
    currency: string;
    role: string;
    slug: string;
    logo: string | null;
};

type OrganizationMember = {
    id: string;
    userId: string;
    organizationId: string;
    authMemberId: string | null;
    role: string;
    createdAt: string | Date;
    user: {
        id: string;
        name: string | null;
        email: string;
    } | null;
};

type ApiError =
    | string
    | {
    code?: string;
    message?: string;
}
    | undefined;

type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: ApiError;
};

type OrganizationsResponse = {
    organizations: Array<{
        id: string;
        authOrganizationId: string;
        name: string;
        phone: string;
        address: string | null;
        wilaya: string;
        currency: string;
        role: string;
        createdAt: string | Date;
        updatedAt: string | Date;
    }>;
    activeOrganizationId: string | null;
};

type MembersResponse = {
    members: OrganizationMember[];
};

const REQUEST_TIMEOUT = 15_000;

async function fetchJson<T>(
    input: RequestInfo | URL,
    init: RequestInit = {},
): Promise<{ response: Response; data: T | null }> {
    const controller = new AbortController();
    const timeout = window.setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT,
    );

    try {
        const response = await fetch(input, {
            ...init,
            signal: controller.signal,
            headers: {
                Accept: "application/json",
                ...init.headers,
            },
            cache: "no-store",
        });

        const contentType =
            response.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
            return {
                response,
                data: null,
            };
        }

        const data = (await response.json()) as T;

        return {
            response,
            data,
        };
    } finally {
        window.clearTimeout(timeout);
    }


}

function getApiErrorMessage<T>(
    result: ApiResponse<T> | null,
    fallback: string,
): string {
    if (!result?.error) {
        return fallback;
    }

    if (typeof result.error === "string") {
        return result.error;
    }

    return result.error.message ?? fallback;


}

function isAbortError(error: unknown): boolean {
    return (
        error instanceof DOMException &&
        error.name === "AbortError"
    );
}

export default function OrganizationSettingsPage() {
    const [organization, setOrganization] =
        useState<Organization | null>(null);

    const [members, setMembers] =
        useState<OrganizationMember[]>([]);

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [logo, setLogo] = useState("");

    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(true);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [membersError, setMembersError] =
        useState<string | null>(null);

    const hasChanges = useMemo(() => {
        if (!organization) {
            return false;
        }

        return (
            name.trim() !== organization.name ||
            slug.trim() !== organization.slug ||
            logo.trim() !== (organization.logo ?? "")
        );
    }, [name, slug, logo, organization]);

    const loadOrganization = useCallback(
        async (signal?: AbortSignal) => {
            setLoading(true);
            setError(null);

            try {
                const {response, data} =
                    await fetchJson<
                        ApiResponse<OrganizationsResponse>
                    >("/api/organizations", {
                        method: "GET",
                        signal,
                    });

                if (
                    !response.ok ||
                    !data?.success ||
                    !data.data
                ) {
                    throw new Error(
                        getApiErrorMessage(
                            data,
                            "Unable to load your organization.",
                        ),
                    );
                }

                const {
                    organizations,
                    activeOrganizationId,
                } = data.data;

                if (!organizations.length) {
                    throw new Error(
                        "You do not belong to any organization.",
                    );
                }

                const active =
                    organizations.find(
                        (item) =>
                            item.authOrganizationId ===
                            activeOrganizationId,
                    ) ?? organizations[0];

                if (!active) {
                    throw new Error(
                        "The active organization could not be found.",
                    );
                }

                const current: Organization = {
                    id: active.id,
                    authOrganizationId:
                    active.authOrganizationId,
                    name: active.name,
                    phone: active.phone,
                    address: active.address,
                    wilaya: active.wilaya,
                    currency: active.currency,
                    role: active.role,
                    slug: "",
                    logo: null,
                };

                setOrganization(current);
                setName(current.name);
                setSlug(current.slug);
                setLogo(current.logo ?? "");
            } catch (error) {
                if (isAbortError(error)) {
                    return;
                }

                console.error(
                    "[Mizan DZ] Failed to load organization:",
                    error,
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load your organization.",
                );
            } finally {
                if (!signal?.aborted) {
                    setLoading(false);
                }
            }
        },
        [],
    );

    const loadMembers = useCallback(
        async (signal?: AbortSignal) => {
            setMembersLoading(true);
            setMembersError(null);

            try {
                const {response, data} =
                    await fetchJson<
                        ApiResponse<MembersResponse>
                    >("/api/members", {
                        method: "GET",
                        signal,
                    });

                if (
                    !response.ok ||
                    !data?.success ||
                    !data.data
                ) {
                    throw new Error(
                        getApiErrorMessage(
                            data,
                            "Unable to load organization members.",
                        ),
                    );
                }

                setMembers(data.data.members);
            } catch (error) {
                if (isAbortError(error)) {
                    return;
                }

                console.error(
                    "[Mizan DZ] Failed to load members:",
                    error,
                );

                setMembersError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load organization members.",
                );
            } finally {
                if (!signal?.aborted) {
                    setMembersLoading(false);
                }
            }
        },
        [],
    );

    useEffect(() => {
        const controller = new AbortController();

        void loadOrganization(controller.signal);
        void loadMembers(controller.signal);

        return () => {
            controller.abort();
        };
    }, [loadOrganization, loadMembers]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!organization || saving || !hasChanges) {
            return;
        }

        setError(null);
        setSaved(false);

        /*
         * The current backend only exposes GET/POST.
         *
         * Do not send a PATCH request until the backend
         * exposes a documented organization-update endpoint.
         */
        setError(
            "Organization editing is not available yet because the update API is not implemented.",
        );
    }

    async function copyOrganizationId() {
        if (!organization || copied) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                organization.id,
            );

            setCopied(true);

            window.setTimeout(() => {
                setCopied(false);
            }, 1800);
        } catch (error) {
            console.error(
                "[Mizan DZ] Failed to copy organization ID:",
                error,
            );

            setError(
                "Could not copy the organization ID.",
            );
        }
    }

    async function handleDelete() {
        if (
            !organization ||
            deleting
        ) {
            return;
        }

        const confirmed = window.confirm(
            "Delete this organization permanently? This action cannot be undone.",
        );

        if (!confirmed) {
            return;
        }

        setDeleting(true);
        setError(null);

        /*
         * The current backend does not expose DELETE.
         *
         * Keep this explicit instead of making a request
         * that is guaranteed to fail.
         */
        setError(
            "Organization deletion is not available yet because the delete API is not implemented.",
        );

        setDeleting(false);
    }

    if (loading) {
        return (
            <main
                dir="rtl"
                className="min-h-full bg-background"
            >
                <div
                    className="flex min-h-[60vh] items-center justify-center px-4"
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Loader2
                            className="h-5 w-5 animate-spin"
                            aria-hidden="true"
                        />
                        <span>
                        Loading organization...
                    </span>
                    </div>
                </div>
            </main>
        );
    }

    if (!organization) {
        return (
            <main
                dir="rtl"
                className="min-h-full bg-background"
            >
                <div className="flex min-h-[60vh] items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                        <div
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                            <Building2
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                        </div>

                        <h1 className="mt-4 text-lg font-semibold">
                            Organization unavailable
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {error ??
                                "We could not find an active organization."}
                        </p>

                        <Link
                            href="/onboarding"
                            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            Go to onboarding
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main
            dir="rtl"
            className="min-h-full bg-background text-foreground"
        >
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header className="mb-8">
                    <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
                        <Link
                            href="/settings"
                            className="transition-colors hover:text-foreground"
                        >
                            Settings
                        </Link>

                        <ChevronLeft
                            className="h-4 w-4"
                            aria-hidden="true"
                        />

                        <span className="text-foreground">
                        Organization
                    </span>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                Organization
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Manage your organization identity,
                                basic information, and team members.
                            </p>
                        </div>

                        <div
                            className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm">
                        <span
                            className="h-2 w-2 rounded-full bg-emerald-500"
                            aria-hidden="true"
                        />
                            Organization active
                        </div>
                    </div>
                </header>

                {error && (
                    <div
                        className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {saved && (
                    <div
                        className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
                        role="status"
                    >
                        Organization changes saved successfully.
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="space-y-6">
                        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border px-5 py-5 sm:px-6">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Building2
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div>
                                        <h2 className="text-sm font-semibold sm:text-base">
                                            Basic Information
                                        </h2>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Manage your organization identity and basic information.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="space-y-6 px-5 py-6 sm:px-6">
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="organization-name"
                                            className="text-sm font-medium"
                                        >
                                            Organization name
                                        </label>

                                        <input
                                            id="organization-name"
                                            value={name}
                                            readOnly
                                            aria-readonly="true"
                                            className="h-11 w-full rounded-xl border border-input bg-muted/30 px-3 text-sm outline-none"
                                        />

                                        <p className="text-xs text-muted-foreground">
                                            Editing will be enabled when the organization update API is available.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor="organization-slug"
                                            className="text-sm font-medium"
                                        >
                                            Organization slug
                                        </label>

                                        <input
                                            id="organization-slug"
                                            value={slug}
                                            readOnly
                                            aria-readonly="true"
                                            dir="ltr"
                                            placeholder="Not available"
                                            className="h-11 w-full rounded-xl border border-input bg-muted/30 px-3 text-sm outline-none"
                                        />

                                        <p className="text-xs text-muted-foreground">
                                            The current organizations endpoint does not expose the Better Auth slug.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor="organization-logo"
                                            className="text-sm font-medium"
                                        >
                                            Organization logo
                                        </label>

                                        <div className="flex min-w-0 items-center gap-3">
                                            <div
                                                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                                                {logo ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={logo}
                                                        alt="Organization logo"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <ImageIcon
                                                        className="h-5 w-5 text-muted-foreground"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </div>

                                            <input
                                                id="organization-logo"
                                                value={logo}
                                                readOnly
                                                aria-readonly="true"
                                                dir="ltr"
                                                placeholder="Not available"
                                                className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-muted/30 px-3 text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-border bg-muted/30 px-5 py-4 sm:px-6">
                                    <button
                                        type="submit"
                                        disabled={
                                            saving ||
                                            !hasChanges
                                        }
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        {saving ? (
                                            <Loader2
                                                className="h-4 w-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Save
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        )}
                                        Save changes
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div
                                className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Users
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div>
                                        <h2 className="text-sm font-semibold sm:text-base">
                                            Organization Members
                                        </h2>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Manage team members, roles, and permissions.
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    href="/members"
                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    Manage members
                                </Link>
                            </div>

                            <div className="p-5 sm:px-6">
                                {membersLoading ? (
                                    <div
                                        className="flex items-center justify-center py-8 text-sm text-muted-foreground"
                                        role="status"
                                    >
                                        <Loader2
                                            className="mr-2 h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                        Loading members...
                                    </div>
                                ) : membersError ? (
                                    <div
                                        className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                                        role="alert"
                                    >
                                        {membersError}
                                    </div>
                                ) : members.length === 0 ? (
                                    <div
                                        className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                                        <Users
                                            className="mx-auto h-6 w-6 text-muted-foreground"
                                            aria-hidden="true"
                                        />

                                        <p className="mt-3 text-sm font-medium">
                                            No members found
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Invite members to start collaborating.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {members
                                            .slice(0, 5)
                                            .map((member) => (
                                                <MemberRow
                                                    key={member.id}
                                                    member={member}
                                                />
                                            ))}

                                        {members.length > 5 && (
                                            <div className="pt-3 text-center">
                                                <Link
                                                    href="/members"
                                                    className="text-sm font-medium text-primary hover:underline"
                                                >
                                                    View all{" "}
                                                    {members.length}{" "}
                                                    members
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-destructive/20 bg-card shadow-sm">
                            <div className="border-b border-destructive/10 bg-destructive/5 px-5 py-5 sm:px-6">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                                        <Trash2
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div>
                                        <h2 className="text-sm font-semibold text-destructive">
                                            Danger Zone
                                        </h2>

                                        <p className="mt-1 text-sm text-destructive/70">
                                            Permanent organization actions.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <div>
                                    <h3 className="text-sm font-medium">
                                        Delete organization
                                    </h3>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        This action cannot be undone.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={handleDelete}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/20 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                                >
                                    {deleting ? (
                                        <Loader2
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Trash2
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    )}
                                    Delete organization
                                </button>
                            </div>
                        </section>
                    </div>

                    <aside className="space-y-6">
                        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border px-5 py-4">
                                <h2 className="text-sm font-semibold">
                                    Current organization
                                </h2>
                            </div>

                            <div className="p-5">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted">
                                        <Building2
                                            className="h-5 w-5 text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">
                                            {organization.name}
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {organization.wilaya}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-xl border border-border bg-muted/30 p-3.5">
                                    <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Organization ID
                                    </span>

                                        <button
                                            type="button"
                                            onClick={copyOrganizationId}
                                            aria-label={
                                                copied
                                                    ? "Organization ID copied"
                                                    : "Copy organization ID"
                                            }
                                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            {copied ? (
                                                <Check
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                <Copy
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </button>
                                    </div>

                                    <code
                                        dir="ltr"
                                        title={organization.id}
                                        className="mt-2 block truncate text-xs"
                                    >
                                        {organization.id}
                                    </code>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="border-b border-border px-5 py-4">
                                <h2 className="text-sm font-semibold">
                                    Organization settings
                                </h2>
                            </div>

                            <nav
                                className="p-2"
                                aria-label="Organization settings"
                            >
                                <SettingsNavItem
                                    href="/settings/organization"
                                    icon={
                                        <Building2
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    }
                                    title="Organization"
                                    active
                                />

                                <SettingsNavItem
                                    href="/members"
                                    icon={
                                        <Users
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    }
                                    title="Members"
                                />

                                <SettingsNavItem
                                    href="/settings"
                                    icon={
                                        <ShieldCheck
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    }
                                    title="General settings"
                                />
                            </nav>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );


}

function MemberRow({
                       member,
                   }: {
    member: OrganizationMember;
}) {
    const displayName =
        member.user?.name?.trim() ||
        member.user?.email ||
        "Unknown user";


    const initials =
        displayName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) =>
                part.charAt(0).toUpperCase(),
            )
            .join("") || "?";

    return (
        <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
            <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
                aria-hidden="true"
            >
                {initials}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                    {displayName}
                </p>

                <p
                    dir="ltr"
                    className="truncate text-xs text-muted-foreground"
                >
                    {member.user?.email ??
                        "No email available"}
                </p>
            </div>

            <span
                className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {member.role}
        </span>
        </div>
    );


}

function SettingsNavItem({
                             href,
                             icon,
                             title,
                             active = false,
                         }: {
    href: string;
    icon: ReactNode;
    title: string;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={[
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
        >
            {icon} <span>{title}</span> </Link>
    );
}
