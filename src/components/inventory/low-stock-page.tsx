"use client";

import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    PackageSearch,
    RefreshCw,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import LowStockSummary from "./low-stock-summary";
import LowStockTable, {
    LowStockItem,
} from "./low-stock-table";

type LowStockStatus =
    | "all"
    | "out_of_stock"
    | "critical"
    | "low_stock";

type ApiResponse = {
    data?: {
        items: LowStockItem[];

        summary: {
            total: number;
            outOfStock: number;
            critical: number;
            lowStock: number;
        };

        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    };

    message?: string;

    error?: {
        message?: string;
    } | string;
};

export default function LowStockPage() {
    const [items, setItems] = useState<
        LowStockItem[]
    >([]);

    const [summary, setSummary] = useState({
        total: 0,
        outOfStock: 0,
        critical: 0,
        lowStock: 0,
    });

    const [page, setPage] =
        useState(1);

    const [search, setSearch] =
        useState("");

    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    const [status, setStatus] =
        useState<LowStockStatus>("all");

    const [pagination, setPagination] =
        useState({
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
        });

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const timeout =
            window.setTimeout(() => {
                setDebouncedSearch(
                    search.trim(),
                );

                setPage(1);
            }, 300);

        return () =>
            window.clearTimeout(
                timeout,
            );
    }, [search]);

    const loadLowStock =
        useCallback(
            async (
                options?: {
                    silent?: boolean;
                },
            ) => {
                try {
                    if (
                        options?.silent
                    ) {
                        setRefreshing(true);
                    } else {
                        setLoading(true);
                    }

                    setError(null);

                    const params =
                        new URLSearchParams({
                            page: String(
                                page,
                            ),
                            limit: "50",
                        });

                    if (
                        debouncedSearch
                    ) {
                        params.set(
                            "search",
                            debouncedSearch,
                        );
                    }

                    if (status !== "all") {
                        params.set(
                            "status",
                            status,
                        );
                    }

                    const response =
                        await fetch(
                            `/api/inventory/low-stock?${params.toString()}`,
                            {
                                cache: "no-store",
                            },
                        );

                    const payload =
                        (await response.json().catch(
                            () => null,
                        )) as ApiResponse | null;

                    if (!response.ok) {
                        let message =
                            "Unable to load low stock products.";

                        if (
                            typeof payload?.error ===
                            "string"
                        ) {
                            message =
                                payload.error;
                        } else if (
                            payload?.error &&
                            typeof payload.error ===
                            "object" &&
                            typeof payload
                                .error.message ===
                            "string"
                        ) {
                            message =
                                payload.error.message;
                        } else if (
                            typeof payload?.message ===
                            "string"
                        ) {
                            message =
                                payload.message;
                        }

                        throw new Error(
                            message,
                        );
                    }

                    const data =
                        payload?.data;

                    if (!data) {
                        throw new Error(
                            "Invalid low stock response.",
                        );
                    }

                    setItems(
                        data.items ?? [],
                    );

                    setSummary(
                        data.summary ?? {
                            total: 0,
                            outOfStock: 0,
                            critical: 0,
                            lowStock: 0,
                        },
                    );

                    setPagination(
                        data.pagination ?? {
                            page,
                            limit: 50,
                            total: 0,
                            totalPages: 1,
                            hasNextPage: false,
                            hasPreviousPage:
                                false,
                        },
                    );
                } catch (err) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load low stock products.",
                    );
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            [
                page,
                debouncedSearch,
                status,
            ],
        );

    useEffect(() => {
        void loadLowStock();
    }, [loadLowStock]);

    function resetFilters() {
        setSearch("");
        setDebouncedSearch("");
        setStatus("all");
        setPage(1);
    }

    return (
        <main
            dir="ltr"
            className="space-y-6 p-6"
        >
            <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-3">


                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Low Stock
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Products that need replenishment attention.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={refreshing}
                        onClick={() =>
                            void loadLowStock({
                                silent: true,
                            })
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            className={
                                refreshing
                                    ? "size-4 animate-spin"
                                    : "size-4"
                            }
                        />
                        Refresh
                    </button>

                    <Link
                        href="/inventory"
                        className="inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium transition hover:bg-muted"
                    >
                        Inventory
                    </Link>
                </div>
            </section>

            <LowStockSummary
                total={summary.total}
                outOfStock={
                    summary.outOfStock
                }
                critical={summary.critical}
                lowStock={summary.lowStock}
            />

            <section className="rounded-xl border bg-card shadow-sm">
                <div className="flex flex-col gap-4 border-b p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-lg">
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
                                placeholder="Search by product name or SKU..."
                                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    [
                                        "all",
                                        "All",
                                    ],
                                    [
                                        "out_of_stock",
                                        "Out of Stock",
                                    ],
                                    [
                                        "critical",
                                        "Critical",
                                    ],
                                    [
                                        "low_stock",
                                        "Low Stock",
                                    ],
                                ] as const
                            ).map(
                                ([
                                     value,
                                     label,
                                 ]) => (
                                    <button
                                        key={
                                            value
                                        }
                                        type="button"
                                        onClick={() => {
                                            setStatus(
                                                value,
                                            );
                                            setPage(
                                                1,
                                            );
                                        }}
                                        className={[
                                            "h-10 rounded-lg border px-3 text-sm font-medium transition",
                                            status ===
                                            value
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        {
                                            label
                                        }
                                    </button>
                                ),
                            )}

                            <button
                                type="button"
                                onClick={
                                    resetFilters
                                }
                                className="h-10 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <LowStockTable
                    items={items}
                    loading={loading}
                />

                <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {pagination.total ===
                        0
                            ? "No products"
                            : `Showing page ${pagination.page} of ${pagination.totalPages}`}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={
                                loading ||
                                !pagination.hasPreviousPage
                            }
                            onClick={() =>
                                setPage(
                                    (
                                        current,
                                    ) =>
                                        Math.max(
                                            1,
                                            current -
                                            1,
                                        ),
                                )
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="size-4" />
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={
                                loading ||
                                !pagination.hasNextPage
                            }
                            onClick={() =>
                                setPage(
                                    (
                                        current,
                                    ) =>
                                        current +
                                        1,
                                )
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}