"use client";

import Link from "next/link";
import {
    ArrowDownToLine,
    ArrowLeft,
    ArrowUpFromLine,
    Package,
    RefreshCw,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import ProductInventoryHeader from "./product-inventory-header";
import ProductInventoryMovementFilters from "./product-inventory-movement-filters";
import ProductInventoryMovementTable from "./product-inventory-movement-table";
import ProductInventorySummary from "./product-inventory-summary";

type ProductInventoryMovement = {
    id: string;
    type: string;
    referenceType: string | null;
    referenceId: string | null;
    referenceNumber: string | null;
    quantity: number;
    quantityChange: number;
    balanceBefore: number;
    balanceAfter: number;
    unitCost: number | null;
    reason: string | null;
    createdBy: string | null;
    createdAt: string;
};

type ProductInventoryResponse = {
    product: {
        id: string;
        organizationId: string;
        name: string;
        sku: string | null;
        description: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stockQuantity: number;
        reorderLevel: number;
        createdAt: string;
        updatedAt: string;
    };

    summary: {
        currentStock: number;
        reorderLevel: number;
        stockValue: number;
        retailValue: number;
    };

    movements: ProductInventoryMovement[];

    pagination: {
        page: number;
        limit: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
};

function extractPayload(
    response: unknown,
): ProductInventoryResponse {
    if (
        typeof response === "object" &&
        response !== null &&
        "data" in response
    ) {
        return (
            response as {
                data: ProductInventoryResponse;
            }
        ).data;
    }

    return response as ProductInventoryResponse;
}

export default function ProductInventoryPage({
                                                 productId,
                                             }: {
    productId: string;
}) {
    const [data, setData] =
        useState<ProductInventoryResponse | null>(
            null,
        );

    const [search, setSearch] =
        useState("");

    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [search]);

    const loadInventory = useCallback(
        async (showLoading = true) => {
            try {
                if (showLoading) {
                    setLoading(true);
                }

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
                    `/api/products/${productId}/inventory?${params.toString()}`,
                    {
                        cache: "no-store",
                    },
                );

                if (!response.ok) {
                    const payload =
                        (await response.json().catch(
                            () => null,
                        )) as {
                            message?: string;
                            error?: string;
                        } | null;

                    throw new Error(
                        payload?.message ||
                        payload?.error ||
                        "Unable to load product inventory.",
                    );
                }

                const payload =
                    await response.json();

                setData(
                    extractPayload(payload),
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load product inventory.",
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [
            productId,
            page,
            debouncedSearch,
        ],
    );

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    function resetSearch() {
        setSearch("");
        setDebouncedSearch("");
        setPage(1);
    }

    if (loading && !data) {
        return (
            <main
                dir="ltr"
                className="space-y-6 p-6"
            >
                <div className="h-8 w-56 animate-pulse rounded bg-muted" />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({
                        length: 4,
                    }).map((_, index) => (
                        <div
                            key={index}
                            className="h-28 animate-pulse rounded-xl bg-muted"
                        />
                    ))}
                </div>

                <div className="h-32 animate-pulse rounded-xl bg-muted" />

                <div className="h-[450px] animate-pulse rounded-xl bg-muted" />
            </main>
        );
    }

    if (error && !data) {
        return (
            <main
                dir="ltr"
                className="p-6"
            >
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <h1 className="font-semibold text-red-700">
                        Unable to load inventory
                    </h1>

                    <p className="mt-2 text-sm text-red-600">
                        {error}
                    </p>

                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                loadInventory()
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium hover:bg-red-50"
                        >
                            <RefreshCw className="size-4" />
                            Retry
                        </button>

                        <Link
                            href={`/products/${productId}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium hover:bg-red-50"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Product
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <main
            dir="ltr"
            className="space-y-6 p-6"
        >
            <ProductInventoryHeader
                product={data.product}
            />

            <ProductInventorySummary
                summary={data.summary}
            />

            <div className="grid gap-4 md:grid-cols-2">
                <Link
                    href="/inventory/adjustments"
                    className="flex items-center justify-between rounded-xl border bg-card p-5 shadow-sm transition hover:bg-muted/40"
                >
                    <div>
                        <p className="font-semibold">
                            Adjust Stock
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Manually increase or decrease this product's stock.
                        </p>
                    </div>

                    <ArrowDownToLine className="size-5 text-primary" />
                </Link>

                <Link
                    href={`/products/${productId}`}
                    className="flex items-center justify-between rounded-xl border bg-card p-5 shadow-sm transition hover:bg-muted/40"
                >
                    <div>
                        <p className="font-semibold">
                            Product Details
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            View and manage the product information.
                        </p>
                    </div>

                    <Package className="size-5 text-primary" />
                </Link>
            </div>

            <section className="rounded-xl border bg-card shadow-sm">
                <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="font-semibold">
                            Inventory Movement History
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            All stock movements recorded for this product.
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={refreshing}
                        onClick={() => {
                            setRefreshing(true);
                            loadInventory(false);
                        }}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
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
                </div>

                <div className="border-b p-4">
                    <ProductInventoryMovementFilters
                        search={search}
                        onSearchChange={
                            setSearch
                        }
                        onReset={resetSearch}
                    />
                </div>

                {error && (
                    <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <ProductInventoryMovementTable
                    items={data.movements}
                    loading={loading}
                />

                <div className="flex items-center justify-between border-t p-4">
                    <p className="text-sm text-muted-foreground">
                        Page {data.pagination.page}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={
                                loading ||
                                !data.pagination
                                    .hasPreviousPage
                            }
                            onClick={() =>
                                setPage(
                                    (current) =>
                                        Math.max(
                                            1,
                                            current - 1,
                                        ),
                                )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ArrowLeft className="size-4" />
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={
                                loading ||
                                !data.pagination
                                    .hasNextPage
                            }
                            onClick={() =>
                                setPage(
                                    (current) =>
                                        current + 1,
                                )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                            <ArrowLeft className="size-4 rotate-180" />
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}