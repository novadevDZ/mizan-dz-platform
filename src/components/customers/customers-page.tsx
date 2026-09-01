"use client";

import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Users,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

type FinancialStatus =
    | "paid"
    | "outstanding"
    | "unpaid";

type FinancialFilter =
    | "all"
    | "outstanding"
    | "unpaid";

type Customer = {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;

    salesTotal?: number;
    paidTotal?: number;
    outstanding?: number;
    financialStatus?: FinancialStatus;
};

type CustomersResponse = {
    items: Customer[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
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

const PAGE_SIZE = 20;

export default function CustomersPage() {
    const [customers, setCustomers] =
        useState<Customer[]>([]);

    const [pagination, setPagination] =
        useState<
            CustomersResponse["pagination"] | null
        >(null);

    const [search, setSearch] =
        useState("");

    const [
        financialFilter,
        setFinancialFilter,
    ] = useState<FinancialFilter>(
        "all",
    );

    const [page, setPage] =
        useState(1);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadCustomers =
        useCallback(
            async (
                targetPage = page,
                targetSearch = search,
                targetFinancialFilter =
                financialFilter,
            ) => {
                setLoading(true);
                setError(null);

                try {
                    const params =
                        new URLSearchParams();

                    params.set(
                        "page",
                        String(targetPage),
                    );

                    params.set(
                        "limit",
                        String(PAGE_SIZE),
                    );

                    if (
                        targetSearch.trim()
                    ) {
                        params.set(
                            "search",
                            targetSearch.trim(),
                        );
                    }

                    if (
                        targetFinancialFilter !==
                        "all"
                    ) {
                        params.set(
                            "financialStatus",
                            targetFinancialFilter,
                        );
                    }

                    const response =
                        await fetch(
                            `/api/customers?${params.toString()}`,
                            {
                                method: "GET",
                                credentials:
                                    "include",
                                headers: {
                                    Accept:
                                        "application/json",
                                },
                                cache:
                                    "no-store",
                            },
                        );

                    const result =
                        (await response.json()) as ApiResponse<CustomersResponse>;

                    /*
                     * Always respect the API error.
                     * Do not throw a fake "Invalid
                     * customers response" error.
                     */
                    if (!response.ok) {
                        setCustomers(
                            [],
                        );

                        setPagination(
                            null,
                        );

                        setError(
                            getApiErrorMessage(
                                result,
                                `Failed to load customers. (${response.status})`,
                            ),
                        );

                        return;
                    }

                    /*
                     * A successful response must
                     * contain data.
                     */
                    if (
                        !result.data ||
                        !Array.isArray(
                            result.data.items,
                        ) ||
                        !result.data.pagination
                    ) {
                        setCustomers(
                            [],
                        );

                        setPagination(
                            null,
                        );

                        setError(
                            "The server returned an invalid customers response.",
                        );

                        return;
                    }

                    setCustomers(
                        result.data.items,
                    );

                    setPagination(
                        result.data.pagination,
                    );
                } catch (err) {
                    console.error(
                        "[Customers]",
                        err,
                    );

                    setCustomers(
                        [],
                    );

                    setPagination(
                        null,
                    );

                    setError(
                        err instanceof
                        Error
                            ? err.message
                            : "Failed to load customers.",
                    );
                } finally {
                    setLoading(false);
                }
            },
            [
                page,
                search,
                financialFilter,
            ],
        );

    useEffect(() => {
        void loadCustomers();
    }, [loadCustomers]);

    useEffect(() => {
        const timeout =
            window.setTimeout(() => {
                setPage(1);
            }, 300);

        return () =>
            window.clearTimeout(
                timeout,
            );
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [financialFilter]);

    function clearFilters() {
        setSearch("");
        setFinancialFilter(
            "all",
        );
        setPage(1);
    }

    const hasFilters =
        Boolean(search.trim()) ||
        financialFilter !== "all";

    return (
        <div className="mizan-page-enter space-y-6">
            {/* Header */}
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                        Customers
                    </p>

                    <h1 className="mizan-page-title mt-1">
                        Customer management
                    </h1>

                    <p className="mizan-page-description">
                        Manage customers, track payments,
                        and monitor outstanding balances.
                    </p>
                </div>

                <Link
                    href="/customers/new"
                    className="mizan-primary-action shrink-0"
                >
                    <Plus className="h-4 w-4"/>

                    <span className="ml-2">
                        New customer
                    </span>
                </Link>
            </section>

            {/* Toolbar */}
            <section className="mizan-card p-3 sm:p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-md">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"/>

                            <input
                                value={search}
                                onChange={(
                                    event,
                                ) =>
                                    setSearch(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="Search customers..."
                                aria-label="Search customers"
                                className="h-10 pl-9"
                            />
                        </div>

                        <div className="text-xs text-[var(--text-muted)]">
                            {pagination
                                ? `${pagination.total} customer${
                                    pagination.total ===
                                    1
                                        ? ""
                                        : "s"
                                }`
                                : loading
                                    ? "Loading..."
                                    : "0 customers"}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <FinancialFilterButton
                            active={
                                financialFilter ===
                                "all"
                            }
                            onClick={() => {
                                setFinancialFilter(
                                    "all",
                                );
                                setPage(1);
                            }}
                        >
                            All
                        </FinancialFilterButton>

                        <FinancialFilterButton
                            active={
                                financialFilter ===
                                "outstanding"
                            }
                            onClick={() => {
                                setFinancialFilter(
                                    "outstanding",
                                );
                                setPage(1);
                            }}
                        >
                            Outstanding
                        </FinancialFilterButton>

                        <FinancialFilterButton
                            active={
                                financialFilter ===
                                "unpaid"
                            }
                            onClick={() => {
                                setFinancialFilter(
                                    "unpaid",
                                );
                                setPage(1);
                            }}
                        >
                            Unpaid
                        </FinancialFilterButton>
                    </div>

                    {hasFilters ? (
                        <div
                            className="flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-3">
                            <p className="text-xs text-[var(--text-muted)]">
                                Active filters
                            </p>

                            <button
                                type="button"
                                onClick={
                                    clearFilters
                                }
                                className="text-xs font-semibold text-[var(--primary)] hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : null}
                </div>
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
                                void loadCustomers()
                            }
                            className="font-semibold underline underline-offset-2"
                        >
                            Retry
                        </button>
                    </div>
                </section>
            ) : null}

            {/* Content */}
            <section className="mizan-dashboard-section overflow-hidden">
                {loading ? (
                    <CustomersLoading/>
                ) : customers.length ===
                0 ? (
                    <CustomersEmpty
                        hasFilters={
                            hasFilters
                        }
                        onClearFilters={
                            clearFilters
                        }
                    />
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="mizan-table min-w-[1050px]">
                                <thead>
                                <tr>
                                    <th>
                                        Customer
                                    </th>

                                    <th>
                                        Phone
                                    </th>

                                    <th>
                                        Sales
                                    </th>

                                    <th>
                                        Paid
                                    </th>

                                    <th>
                                        Outstanding
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Created
                                    </th>

                                    <th className="text-right">
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {customers.map(
                                    (
                                        customer,
                                    ) => (
                                        <tr
                                            key={
                                                customer.id
                                            }
                                        >
                                            <td>
                                                <Link
                                                    href={`/customers/${customer.id}`}
                                                    className="group flex min-w-0 items-center gap-3"
                                                >
                                                    <CustomerAvatar
                                                        name={
                                                            customer.name
                                                        }
                                                    />

                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                                                            {
                                                                customer.name
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                                                            {
                                                                customer.id
                                                            }
                                                        </p>
                                                    </div>
                                                </Link>
                                            </td>

                                            <td>
                                                {
                                                    customer.phone ||
                                                    "—"
                                                }
                                            </td>

                                            <td className="font-semibold">
                                                {formatMoney(
                                                    customer.salesTotal,
                                                )}
                                            </td>

                                            <td className="font-semibold">
                                                {formatMoney(
                                                    customer.paidTotal,
                                                )}
                                            </td>

                                            <td className="font-bold">
                                                {formatMoney(
                                                    customer.outstanding,
                                                )}
                                            </td>

                                            <td>
                                                <FinancialStatusBadge
                                                    status={
                                                        customer.financialStatus
                                                    }
                                                />
                                            </td>

                                            <td>
                                                {formatDate(
                                                    customer.createdAt,
                                                )}
                                            </td>

                                            <td className="text-right">
                                                <Link
                                                    href={`/customers/${customer.id}`}
                                                    className="text-xs font-semibold text-[var(--primary)] hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ),
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="divide-y divide-[var(--border-soft)] md:hidden">
                            {customers.map(
                                (
                                    customer,
                                ) => (
                                    <Link
                                        key={
                                            customer.id
                                        }
                                        href={`/customers/${customer.id}`}
                                        className="block p-4 transition hover:bg-[var(--surface-secondary)]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <CustomerAvatar
                                                name={
                                                    customer.name
                                                }
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                            {
                                                                customer.name
                                                            }
                                                        </p>

                                                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                                                            {
                                                                customer.phone ||
                                                                "No phone"
                                                            }
                                                        </p>
                                                    </div>

                                                    <ChevronRight
                                                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]"/>
                                                </div>

                                                <div className="mt-3 grid grid-cols-3 gap-3">
                                                    <CustomerMoney
                                                        label="Sales"
                                                        value={
                                                            customer.salesTotal
                                                        }
                                                    />

                                                    <CustomerMoney
                                                        label="Paid"
                                                        value={
                                                            customer.paidTotal
                                                        }
                                                    />

                                                    <CustomerMoney
                                                        label="Due"
                                                        value={
                                                            customer.outstanding
                                                        }
                                                        emphasis
                                                    />
                                                </div>

                                                <div className="mt-3 flex items-center justify-between gap-3">
                                                    <FinancialStatusBadge
                                                        status={
                                                            customer.financialStatus
                                                        }
                                                    />

                                                    <span className="truncate text-[11px] text-[var(--text-muted)]">
                                                        {customer.address ||
                                                            "No address"}
                                                    </span>
                                                </div>

                                                <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                                                    {formatDate(
                                                        customer.createdAt,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ),
                            )}
                        </div>

                        <Pagination
                            pagination={
                                pagination
                            }
                            onPageChange={(
                                nextPage,
                            ) =>
                                setPage(
                                    nextPage,
                                )
                            }
                        />
                    </>
                )}
            </section>
        </div>
    );
}

function FinancialFilterButton({
                                   active,
                                   onClick,
                                   children,
                               }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={
                active
                    ? "rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white"
                    : "rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-secondary)]"
            }
        >
            {children}
        </button>
    );
}

function FinancialStatusBadge({
                                  status,
                              }: {
    status?: FinancialStatus;
}) {
    if (
        status === "unpaid"
    ) {
        return (
            <span
                className="inline-flex items-center rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--danger)]">
                Unpaid
            </span>
        );
    }

    if (
        status === "outstanding"
    ) {
        return (
            <span
                className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Outstanding
            </span>
        );
    }

    return (
        <span
            className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Paid
        </span>
    );
}

function CustomerMoney({
                           label,
                           value,
                           emphasis = false,
                       }: {
    label: string;
    value?: number;
    emphasis?: boolean;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                {label}
            </p>

            <p
                className={
                    emphasis
                        ? "mt-1 truncate text-sm font-black text-[var(--text-primary)]"
                        : "mt-1 truncate text-sm font-semibold text-[var(--text-primary)]"
                }
            >
                {formatMoney(
                    value,
                )}
            </p>
        </div>
    );
}

function CustomersLoading() {
    return (
        <div className="space-y-1 p-3">
            {Array.from({
                length: 6,
            }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl p-3"
                >
                    <div className="mizan-skeleton h-10 w-10 shrink-0 rounded-xl"/>

                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="mizan-skeleton h-3 w-40 rounded"/>

                        <div className="mizan-skeleton h-2.5 w-24 rounded"/>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CustomersEmpty({
                            hasFilters,
                            onClearFilters,
                        }: {
    hasFilters: boolean;
    onClearFilters: () => void;
}) {
    return (
        <div className="mizan-empty min-h-[360px]">
            <div className="mizan-empty-icon">
                <Users className="h-5 w-5"/>
            </div>

            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {hasFilters
                    ? "No customers found"
                    : "No customers yet"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
                {hasFilters
                    ? "Try a different search or financial filter."
                    : "Create your first customer to start building your customer base."}
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {hasFilters ? (
                    <button
                        type="button"
                        onClick={
                            onClearFilters
                        }
                        className="mizan-ghost-action"
                    >
                        Clear filters
                    </button>
                ) : null}

                <Link
                    href="/customers/new"
                    className="mizan-primary-action"
                >
                    <Plus className="h-4 w-4"/>

                    <span className="ml-2">
                        Create customer
                    </span>
                </Link>
            </div>
        </div>
    );
}

function Pagination({
                        pagination,
                        onPageChange,
                    }: {
    pagination:
        | CustomersResponse["pagination"]
        | null;
    onPageChange: (
        page: number,
    ) => void;
}) {
    if (
        !pagination ||
        pagination.totalPages <= 1
    ) {
        return null;
    }

    return (
        <div
            className="flex flex-col gap-3 border-t border-[var(--border-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--text-muted)]">
                Page {pagination.page} of{" "}
                {pagination.totalPages}
            </p>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={
                        !pagination.hasPreviousPage
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.page -
                            1,
                        )
                    }
                    className="mizan-ghost-action px-3 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4"/>
                </button>

                <button
                    type="button"
                    disabled={
                        !pagination.hasNextPage
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.page +
                            1,
                        )
                    }
                    className="mizan-ghost-action px-3 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4"/>
                </button>
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
                (part) =>
                    part[0],
            )
            .join("")
            .toUpperCase() ||
        "C";

    return (
        <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-xs font-bold text-[var(--primary)]">
            {initials}
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
        typeof result.error.message ===
        "string"
    ) {
        return result.error.message;
    }

    if (
        typeof result.message ===
        "string"
    ) {
        return result.message;
    }

    return fallback;
}

function formatMoney(
    value?: number,
) {
    const amount =
        typeof value ===
        "number"
            ? value
            : 0;

    return new Intl.NumberFormat(
        "en-DZ",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    ).format(amount);
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