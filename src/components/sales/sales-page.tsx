"use client";

import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    CircleX,
    Clock3,
    Plus,
    Receipt,
    Search,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

type SaleStatus =
    | "draft"
    | "confirmed"
    | "canceled";

type Sale = {
    id: string;
    saleNumber: string;
    customerId: string;
    customerName: string | null;
    status: SaleStatus;
    totalAmount: string;
    createdAt: string;
    updatedAt: string;
};

type SalesResponse = {
    items: Sale[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
};

type ApiResponse<T> = {
    data?: T;
    message?: string;
};

const PAGE_SIZE = 20;

export default function SalesPage() {
    const [sales, setSales] =
        useState<Sale[]>([]);

    const [pagination, setPagination] =
        useState<
            SalesResponse["pagination"] | null
        >(null);

    const [search, setSearch] =
        useState("");

    const [status, setStatus] =
        useState<"all" | SaleStatus>(
            "all",
        );

    const [page, setPage] =
        useState(1);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadSales = useCallback(
        async (
            targetPage = page,
            targetSearch = search,
            targetStatus = status,
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
                    targetStatus !==
                    "all"
                ) {
                    params.set(
                        "status",
                        targetStatus,
                    );
                }

                const response =
                    await fetch(
                        `/api/sales?${params.toString()}`,
                        {
                            method: "GET",
                            headers: {
                                Accept:
                                    "application/json",
                            },
                            cache: "no-store",
                        },
                    );

                const result =
                    (await response.json()) as ApiResponse<SalesResponse>;

                if (!response.ok) {
                    throw new Error(
                        result.message ??
                        "Failed to load sales.",
                    );
                }

                if (!result.data) {
                    throw new Error(
                        "Invalid sales response.",
                    );
                }

                setSales(
                    result.data.items,
                );

                setPagination(
                    result.data.pagination,
                );
            } catch (err) {
                console.error(
                    "[Sales]",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load sales.",
                );
            } finally {
                setLoading(false);
            }
        },
        [page, search, status],
    );

    useEffect(() => {
        void loadSales();
    }, [loadSales]);

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
    }, [status]);

    return (
        <div className="mizan-page-enter space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                        Sales
                    </p>

                    <h1 className="mizan-page-title mt-1">
                        Sales management
                    </h1>

                    <p className="mizan-page-description">
                        Create, review, and manage your
                        business sales.
                    </p>
                </div>

                <Link
                    href="/sales/new"
                    className="mizan-primary-action shrink-0"
                >
                    <Plus className="h-4 w-4" />

                    <span className="ml-2">
                        New sale
                    </span>
                </Link>
            </section>

            <section className="mizan-card p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

                            <input
                                value={
                                    search
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Search sales..."
                                aria-label="Search sales"
                                className="h-10 pl-9"
                            />
                        </div>

                        <div className="text-xs text-[var(--text-muted)]">
                            {pagination
                                ? `${pagination.total} sale${
                                    pagination.total ===
                                    1
                                        ? ""
                                        : "s"
                                }`
                                : "Loading..."}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <StatusFilterButton
                            active={
                                status === "all"
                            }
                            onClick={() =>
                                setStatus(
                                    "all",
                                )
                            }
                        >
                            All
                        </StatusFilterButton>

                        <StatusFilterButton
                            active={
                                status ===
                                "draft"
                            }
                            onClick={() =>
                                setStatus(
                                    "draft",
                                )
                            }
                        >
                            Draft
                        </StatusFilterButton>

                        <StatusFilterButton
                            active={
                                status ===
                                "confirmed"
                            }
                            onClick={() =>
                                setStatus(
                                    "confirmed",
                                )
                            }
                        >
                            Confirmed
                        </StatusFilterButton>

                        <StatusFilterButton
                            active={
                                status ===
                                "canceled"
                            }
                            onClick={() =>
                                setStatus(
                                    "canceled",
                                )
                            }
                        >
                            Canceled
                        </StatusFilterButton>
                    </div>
                </div>
            </section>

            {error ? (
                <section
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"
                >
                    {error}

                    <button
                        type="button"
                        onClick={() =>
                            void loadSales()
                        }
                        className="ml-3 font-semibold underline underline-offset-2"
                    >
                        Retry
                    </button>
                </section>
            ) : null}

            <section className="mizan-dashboard-section overflow-hidden">
                {loading ? (
                    <SalesLoading />
                ) : sales.length === 0 ? (
                    <SalesEmpty
                        hasSearch={
                            Boolean(
                                search.trim(),
                            ) ||
                            status !==
                            "all"
                        }
                        onClear={() => {
                            setSearch(
                                "",
                            );
                            setStatus(
                                "all",
                            );
                        }}
                    />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="mizan-table min-w-[850px]">
                                <thead>
                                <tr>
                                    <th>Sale</th>
                                    <th>Customer</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                    <th>Created</th>
                                    <th className="text-right">
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {sales.map(
                                    (
                                        sale,
                                    ) => (
                                        <tr
                                            key={
                                                sale.id
                                            }
                                        >
                                            <td>
                                                <Link
                                                    href={`/sales/${sale.id}`}
                                                    className="group flex min-w-0 items-center gap-3"
                                                >
                                                    <SaleAvatar />

                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                                                            {
                                                                sale.saleNumber
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                                                            {
                                                                sale.id
                                                            }
                                                        </p>
                                                    </div>
                                                </Link>
                                            </td>

                                            <td>
                                                {
                                                    sale.customerName ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                <SaleStatusBadge
                                                    status={
                                                        sale.status
                                                    }
                                                />
                                            </td>

                                            <td className="font-semibold">
                                                {formatMoney(
                                                    sale.totalAmount,
                                                )}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    sale.createdAt,
                                                )}
                                            </td>

                                            <td className="text-right">
                                                <Link
                                                    href={`/sales/${sale.id}`}
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

                        <div className="divide-y divide-[var(--border-soft)] md:hidden">
                            {sales.map(
                                (
                                    sale,
                                ) => (
                                    <Link
                                        key={
                                            sale.id
                                        }
                                        href={`/sales/${sale.id}`}
                                        className="block p-4 transition hover:bg-[var(--surface-secondary)]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <SaleAvatar />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                            {
                                                                sale.saleNumber
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                            {
                                                                sale.customerName ||
                                                                "No customer"
                                                            }
                                                        </p>
                                                    </div>

                                                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                                                </div>

                                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                                    <SaleStatusBadge
                                                        status={
                                                            sale.status
                                                        }
                                                    />

                                                    <span className="text-sm font-bold text-[var(--text-primary)]">
                                                        {formatMoney(
                                                            sale.totalAmount,
                                                        )}
                                                    </span>
                                                </div>
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

function StatusFilterButton({
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

function SaleStatusBadge({
                             status,
                         }: {
    status: SaleStatus;
}) {
    if (status === "confirmed") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <CircleCheck className="h-3.5 w-3.5" />

                Confirmed
            </span>
        );
    }

    if (status === "canceled") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--danger)]">
                <CircleX className="h-3.5 w-3.5" />

                Canceled
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <Clock3 className="h-3.5 w-3.5" />

            Draft
        </span>
    );
}

function SaleAvatar() {
    return (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
            <Receipt className="h-4 w-4" />
        </div>
    );
}

function SalesLoading() {
    return (
        <div className="space-y-1 p-3">
            {Array.from({
                length: 6,
            }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl p-3"
                >
                    <div className="mizan-skeleton h-10 w-10 shrink-0 rounded-xl" />

                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="mizan-skeleton h-3 w-40 rounded" />
                        <div className="mizan-skeleton h-2.5 w-28 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SalesEmpty({
                        hasSearch,
                        onClear,
                    }: {
    hasSearch: boolean;
    onClear: () => void;
}) {
    return (
        <div className="mizan-empty min-h-[360px]">
            <div className="mizan-empty-icon">
                <Receipt className="h-5 w-5" />
            </div>

            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {hasSearch
                    ? "No sales found"
                    : "No sales yet"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
                {hasSearch
                    ? "Try a different search or status filter."
                    : "Create your first sale to start tracking transactions."}
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {hasSearch ? (
                    <button
                        type="button"
                        onClick={onClear}
                        className="mizan-ghost-action"
                    >
                        Clear filters
                    </button>
                ) : null}

                <Link
                    href="/sales/new"
                    className="mizan-primary-action"
                >
                    <Plus className="h-4 w-4" />

                    <span className="ml-2">
                        Create sale
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
        | SalesResponse["pagination"]
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
        <div className="flex flex-col gap-3 border-t border-[var(--border-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
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
                    className="mizan-ghost-action px-3"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
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
                    className="mizan-ghost-action px-3"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function formatMoney(
    value: string,
) {
    return new Intl.NumberFormat(
        "en-DZ",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    ).format(Number(value));
}

function formatDate(
    value: string,
) {
    return new Intl.DateTimeFormat(
        "en-DZ",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        },
    ).format(new Date(value));
}