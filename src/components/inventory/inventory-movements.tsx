"use client";

import {
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from "lucide-react";
import {useEffect, useState} from "react";

import InventoryMovementFilters from "./inventory-movement-filters";
import InventoryMovementTable from "./inventory-movement-table";

import type {
    InventoryMovement,
    InventoryMovementResponse,
} from "./inventory-types";

function extractPayload(
    response: unknown,
): InventoryMovementResponse {
    const root =
        typeof response === "object" &&
        response !== null &&
        "data" in response
            ? (
                response as {
                    data: unknown;
                }
            ).data
            : response;

    return root as InventoryMovementResponse;
}

export default function InventoryMovements() {
    const [items, setItems] = useState<InventoryMovement[]>(
        [],
    );

    const [search, setSearch] = useState("");

    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState<
        InventoryMovementResponse["pagination"] | null
    >(null);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] = useState<string | null>(
        null,
    );

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [search]);

    async function load() {
        try {
            setError(null);

            const params = new URLSearchParams({
                page: String(page),
                limit: "50",
            });

            if (debouncedSearch) {
                params.set(
                    "search",
                    debouncedSearch,
                );
            }

            const response = await fetch(
                `/api/inventory/movements?${params.toString()}`,
                {
                    cache: "no-store",
                },
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to load inventory movements.",
                );
            }

            const payload: unknown =
                await response.json();

            const data = extractPayload(payload);

            setItems(data.items ?? []);

            setPagination(
                data.pagination ?? null,
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load inventory movements.",
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        setLoading(true);
        void load();
    }, [page, debouncedSearch]);

    function reset() {
        setSearch("");
        setDebouncedSearch("");
        setPage(1);
    }

    function handleRefresh() {
        if (refreshing) {
            return;
        }

        setRefreshing(true);
        void load();
    }

    return (
        <main
            dir="ltr"
            className="w-full min-w-0 space-y-6 p-4 sm:p-6"
        >
            <section className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Inventory Movements
                </h1>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Review and track every inventory operation
                    that changes stock quantities.
                </p>
            </section>

            <section className="w-full min-w-0 rounded-xl border bg-card shadow-sm">
                <div className="border-b p-4 sm:p-5">
                    <InventoryMovementFilters
                        search={search}
                        onSearchChange={setSearch}
                        onReset={reset}
                    />
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-5 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                    >
                        {error}
                    </div>
                )}

                <div className="w-full min-w-0">
                    <InventoryMovementTable
                        items={items}
                        loading={loading}
                    />
                </div>

                <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page{" "}
                        <span className="font-medium text-foreground">
                            {pagination?.page ?? page}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                        <button
                            type="button"
                            onClick={() =>
                                setPage((current) =>
                                    Math.max(
                                        1,
                                        current - 1,
                                    ),
                                )
                            }
                            disabled={
                                loading ||
                                !pagination?.hasPreviousPage
                            }
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border px-3 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="size-4"/>
                            <span className="hidden sm:inline">
                                Previous
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setPage(
                                    (current) =>
                                        current + 1,
                                )
                            }
                            disabled={
                                loading ||
                                !pagination?.hasNextPage
                            }
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border px-3 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <span className="hidden sm:inline">
                                Next
                            </span>
                            <ChevronRight className="size-4"/>
                        </button>

                        <button
                            type="button"
                            disabled={refreshing}
                            onClick={handleRefresh}
                            className="inline-flex h-9 items-center justify-center rounded-lg border px-3 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Refresh inventory movements"
                            title="Refresh inventory movements"
                        >
                            <RefreshCw
                                className={
                                    refreshing
                                        ? "size-4 animate-spin"
                                        : "size-4"
                                }
                            />

                            <span className="ml-2 hidden sm:inline">
                                Refresh
                            </span>
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}