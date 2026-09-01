"use client";

import Link from "next/link";
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    ClipboardCheck,
    History,
    RefreshCw,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import InventoryMovementTable from "@/src/components/inventory/inventory-movement-table";
import InventoryQuickActions from "@/src/components/inventory/inventory-quick-actions";
import InventorySummary from "./inventory-summary";

import type {
    InventoryMovement,
    InventoryMovementResponse,
} from "./inventory-types";

function extractPayload(
    response: unknown,
): InventoryMovementResponse {
    if (
        typeof response === "object" &&
        response !== null &&
        "data" in response
    ) {
        return (
            response as {
                data: InventoryMovementResponse;
            }
        ).data;
    }

    return response as InventoryMovementResponse;
}

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadRecentMovements = useCallback(async () => {
        try {
            setError(null);

            const response = await fetch(
                "/api/inventory/movements?page=1&limit=8",
                {
                    cache: "no-store",
                },
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to load inventory movements.",
                );
            }

            const payload: unknown = await response.json();
            const data = extractPayload(payload);

            setItems(data.items ?? []);
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
    }, []);

    useEffect(() => {
        void loadRecentMovements();
    }, [loadRecentMovements]);

    const totalIn = items
        .filter((item) => item.quantityChange > 0)
        .reduce(
            (sum, item) => sum + item.quantityChange,
            0,
        );

    const totalOut = items
        .filter((item) => item.quantityChange < 0)
        .reduce(
            (sum, item) =>
                sum + Math.abs(item.quantityChange),
            0,
        );

    const latestBalance = items[0]?.balanceAfter ?? null;

    const handleRefresh = () => {
        if (refreshing) {
            return;
        }

        setRefreshing(true);
        void loadRecentMovements();
    };

    return (
        <main
            dir="ltr"
            className="w-full min-w-0 space-y-6 p-4 sm:p-6"
        >
            {/* Header */}
            <section className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-semibold tracking-tight">
                        Inventory Tracker
                    </h1>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Track inventory movements, balances,
                        adjustments, and stock counts.
                    </p>
                </div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
                    <Link
                        href="/inventory/movements"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
                    >
                        <History className="size-4 shrink-0" />

                        <span className="truncate">
                            Movement History
                        </span>
                    </Link>

                    <Link
                        href="/inventory/adjustments"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        <ArrowDownToLine className="size-4 shrink-0" />

                        <span className="truncate">
                            Adjust Stock
                        </span>
                    </Link>
                </div>
            </section>

            {/* Summary */}
            <section className="min-w-0">
                <InventorySummary
                    movementCount={items.length}
                    totalIn={totalIn}
                    totalOut={totalOut}
                    latestBalance={latestBalance}
                />
            </section>

            {/* Quick Actions */}
            <section className="min-w-0">
                <InventoryQuickActions />
            </section>

            {/* Recent Movements */}
            <section className="w-full min-w-0 rounded-xl border bg-card shadow-sm">
                <div className="flex min-w-0 flex-col gap-4 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="font-semibold">
                            Recent Movements
                        </h2>

                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                            The latest inventory operations
                            recorded in the system.
                        </p>
                    </div>

                    <div className="grid w-full grid-cols-2 gap-2 lg:w-auto">
                        <button
                            type="button"
                            disabled={refreshing}
                            onClick={handleRefresh}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50 lg:w-9 lg:px-0"
                            aria-label="Refresh inventory movements"
                        >
                            <RefreshCw
                                className={
                                    refreshing
                                        ? "size-4 animate-spin"
                                        : "size-4"
                                }
                            />

                            <span className="lg:hidden">
                                Refresh
                            </span>
                        </button>

                        <Link
                            href="/inventory/movements"
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-muted"
                        >
                            <span>View All</span>

                            <ArrowUpFromLine className="size-3.5 shrink-0" />
                        </Link>
                    </div>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-5 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                    >
                        {error}
                    </div>
                )}

                {/*
                 * Important:
                 * Do NOT add overflow-x-auto here.
                 * InventoryMovementTable owns the horizontal scrolling.
                 */}
                <div className="w-full min-w-0">
                    <InventoryMovementTable
                        items={items}
                        loading={loading}
                    />
                </div>
            </section>

            {/* Inventory Rule */}
            <section className="w-full min-w-0 rounded-xl border bg-muted/30 p-4 sm:p-5">
                <div className="flex min-w-0 items-start gap-3">
                    <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-primary" />

                    <div className="min-w-0">
                        <h3 className="font-medium">
                            Inventory Rule
                        </h3>

                        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                            Every stock balance change must
                            leave an entry in
                            inventoryMovements. Do not modify
                            stock manually without recording
                            the reason for the movement.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}