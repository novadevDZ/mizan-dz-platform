"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    Edit3,
    MapPin,
    Phone,
    Trash2,
    User,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";
import {useRouter} from "next/navigation";

import {useConfirm} from "@/src/components/dashboard/confirm-provider";

import type {CustomerPermissions} from "@/src/app/(dashboard)/customers/[id]/page";

type Customer = {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
};

type ApiError = {
    message?: string;
    code?: string;
};

type ApiResponse<T = unknown> = {
    success?: boolean;
    data?: T;
    message?: string;
    error?: ApiError | string;
};

type DeleteCustomerResponse = {
    id: string;
    deleted: boolean;
};

type CustomerDetailsProps = {
    id: string;
    permissions: CustomerPermissions;
};

export default function CustomerDetails({
                                            id,
                                            permissions,
                                        }: CustomerDetailsProps) {
    const router = useRouter();
    const confirm = useConfirm();

    const [customer, setCustomer] =
        useState<Customer | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [deleting, setDeleting] =
        useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadCustomer() {
            setLoading(true);
            setError(null);

            try {
                const response =
                    await fetch(
                        `/api/customers/${id}`,
                        {
                            method: "GET",
                            credentials: "include",
                            headers: {
                                Accept:
                                    "application/json",
                            },
                            cache: "no-store",
                        },
                    );

                const rawResponse =
                    await response.text();

                let result:
                    ApiResponse<Customer> = {};

                if (rawResponse.trim()) {
                    try {
                        result =
                            JSON.parse(
                                rawResponse,
                            ) as ApiResponse<Customer>;
                    } catch {
                        throw new Error(
                            "The server returned an invalid response.",
                        );
                    }
                }

                if (response.status === 404) {
                    router.replace("/customers");
                    return;
                }

                if (response.status === 401) {
                    throw new Error(
                        "You are not authenticated.",
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "You do not have permission to view this customer.",
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        getApiErrorMessage(
                            result,
                            "Failed to load customer.",
                        ),
                    );
                }

                if (result.success === false) {
                    throw new Error(
                        getApiErrorMessage(
                            result,
                            "Failed to load customer.",
                        ),
                    );
                }

                if (!result.data) {
                    throw new Error(
                        "Customer data was not returned by the server.",
                    );
                }

                if (!cancelled) {
                    setCustomer(
                        result.data,
                    );
                }
            } catch (caughtError) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "[CustomerDetails] Load failed:",
                    caughtError,
                );

                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : "Failed to load customer.",
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadCustomer();

        return () => {
            cancelled = true;
        };
    }, [id, router]);

    async function handleDelete() {
        /*
         * Defense in depth.
         *
         * Even though the button is hidden when the user
         * lacks permission, the handler checks permission too.
         */
        if (
            !customer ||
            deleting ||
            !permissions.delete
        ) {
            return;
        }

        const confirmed =
            await confirm({
                variant: "danger",
                destructive: true,
                title: "Delete this customer?",
                description:
                    `"${customer.name}" will be moved to the deleted state and removed from your active customer list.`,
                confirmLabel:
                    "Delete customer",
                cancelLabel:
                    "Keep customer",
            });

        if (!confirmed) {
            return;
        }

        setDeleting(true);
        setError(null);

        try {
            const response =
                await fetch(
                    `/api/customers/${customer.id}`,
                    {
                        method: "DELETE",
                        credentials: "include",
                        headers: {
                            Accept:
                                "application/json",
                        },
                    },
                );

            const rawResponse =
                await response.text();

            let result:
                ApiResponse<DeleteCustomerResponse> =
                {};

            if (rawResponse.trim()) {
                try {
                    result =
                        JSON.parse(
                            rawResponse,
                        ) as ApiResponse<DeleteCustomerResponse>;
                } catch {
                    throw new Error(
                        "The server returned an invalid response.",
                    );
                }
            }

            if (response.status === 401) {
                throw new Error(
                    "You are not authenticated.",
                );
            }

            if (response.status === 403) {
                throw new Error(
                    "You do not have permission to delete customers.",
                );
            }

            if (response.status === 404) {
                throw new Error(
                    "Customer not found.",
                );
            }

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(
                        result,
                        "Failed to delete customer.",
                    ),
                );
            }

            if (result.success === false) {
                throw new Error(
                    getApiErrorMessage(
                        result,
                        "Failed to delete customer.",
                    ),
                );
            }

            router.replace("/customers");
            router.refresh();
        } catch (caughtError) {
            console.error(
                "[CustomerDetails] Delete failed:",
                caughtError,
            );

            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : "Failed to delete customer.",
            );
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="mizan-skeleton h-8 w-40 rounded"/>

                <div className="mizan-card p-6">
                    <div className="space-y-4">
                        <div className="mizan-skeleton h-5 w-52 rounded"/>

                        <div className="mizan-skeleton h-4 w-80 rounded"/>

                        <div className="mizan-skeleton h-4 w-64 rounded"/>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="mizan-empty">
                <p className="text-sm font-semibold text-[var(--danger)]">
                    {error ??
                        "Customer not found."}
                </p>

                <Link
                    href="/customers"
                    className="mizan-primary-action mt-5"
                >
                    <ArrowLeft className="h-4 w-4"/>

                    <span className="ml-2">
                        Back to customers
                    </span>
                </Link>
            </div>
        );
    }

    return (
        <div className="mizan-page-enter space-y-6">
            {/* =====================================================
                HEADER
               ===================================================== */}

            <section className="mizan-page-header">
                <div className="min-w-0">
                    <Link
                        href="/customers"
                        className="inline-flex items-center text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5"/>

                        Customers
                    </Link>

                    <div className="mt-3 flex items-start gap-3">
                        <CustomerAvatar
                            name={customer.name}
                        />

                        <div className="min-w-0">
                            <h1 className="mizan-page-title">
                                {customer.name}
                            </h1>

                            <p className="mt-1 break-all text-xs text-[var(--text-muted)]">
                                Customer ID:{" "}
                                {customer.id}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    {/* =================================================
                        EDIT
                       ================================================= */}

                    {permissions.update ? (
                        <Link
                            href={`/customers/${customer.id}/edit`}
                            className="mizan-ghost-action"
                        >
                            <Edit3 className="h-4 w-4"/>

                            <span className="ml-2">
    Edit
    </span>
                        </Link>
                    ) : null}

                    {/* =================================================
                        DELETE
                       ================================================= */}

                    {permissions.delete ? (
                        <button
                            type="button"
                            disabled={deleting}
                            onClick={handleDelete}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 text-xs font-semibold text-[var(--danger)] transition hover:border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] disabled:pointer-events-none disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4"/>

                            <span className="ml-2">
                                {deleting
                                    ? "Deleting..."
                                    : "Delete"}
                            </span>
                        </button>
                    ) : null}
                </div>
            </section>

            {/* =====================================================
                ERROR
               ===================================================== */}

            {error ? (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"
                >
                    {error}
                </div>
            ) : null}

            {/* =====================================================
                CONTENT
               ===================================================== */}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                {/* INFORMATION */}

                <section className="mizan-dashboard-section">
                    <div className="mizan-dashboard-section-header">
                        <div>
                            <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                Customer information
                            </h2>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Contact and business details.
                            </p>
                        </div>

                        <User className="h-4 w-4 text-[var(--text-muted)]"/>
                    </div>

                    <div className="mizan-dashboard-section-body grid gap-5 sm:grid-cols-2">
                        <InfoItem
                            icon={Phone}
                            label="Phone"
                            value={
                                customer.phone ||
                                "Not provided"
                            }
                        />

                        <InfoItem
                            icon={MapPin}
                            label="Address"
                            value={
                                customer.address ||
                                "Not provided"
                            }
                        />

                        <InfoItem
                            icon={CalendarDays}
                            label="Created"
                            value={formatDateTime(
                                customer.createdAt,
                            )}
                        />

                        <InfoItem
                            icon={CalendarDays}
                            label="Last updated"
                            value={formatDateTime(
                                customer.updatedAt,
                            )}
                        />
                    </div>
                </section>

                {/* NOTES */}

                <section className="mizan-dashboard-section">
                    <div className="mizan-dashboard-section-header">
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">
                            Notes
                        </h2>
                    </div>

                    <div className="mizan-dashboard-section-body">
                        {customer.notes ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-secondary)]">
                                {customer.notes}
                            </p>
                        ) : (
                            <p className="text-sm text-[var(--text-muted)]">
                                No notes have been added.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function getApiErrorMessage(
    result: ApiResponse,
    fallback: string,
): string {
    if (
        typeof result.error === "string"
    ) {
        return result.error;
    }

    if (
        result.error &&
        typeof result.error === "object" &&
        typeof result.error.message === "string"
    ) {
        return result.error.message;
    }

    if (
        typeof result.message === "string"
    ) {
        return result.message;
    }

    return fallback;
}

function InfoItem({
                      icon: Icon,
                      label,
                      value,
                  }: {
    icon: React.ComponentType<{
        className?: string;
    }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                <Icon className="h-4 w-4"/>
            </div>

            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    {label}
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-[var(--text-primary)]">
                    {value}
                </p>
            </div>
        </div>
    );
}

function CustomerAvatar({
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
            .map(
                (part) => part[0],
            )
            .join("")
            .toUpperCase() || "C";

    return (
        <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-sm font-bold text-[var(--primary)]">
            {initials}
        </div>
    );
}

function formatDateTime(
    value: string,
): string {
    const date = new Date(value);

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
            dateStyle: "medium",
            timeStyle: "short",
        },
    ).format(date);
}