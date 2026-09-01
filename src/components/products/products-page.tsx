"use client";

import Link from "next/link";
import {
    Archive,
    Box,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

type Product = {
    id: string;
    name: string;
    sku: string | null;
    description: string | null;
    purchasePrice: string;
    sellingPrice: string;
    stockQuantity: number;
    createdAt: string;
    updatedAt: string;
};

type ProductsResponse = {
    items: Product[];
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

export default function ProductsPage() {
    const [products, setProducts] =
        useState<Product[]>([]);

    const [pagination, setPagination] =
        useState<
            ProductsResponse["pagination"] | null
        >(null);

    const [search, setSearch] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [archivingId, setArchivingId] =
        useState<string | null>(null);

    const loadProducts = useCallback(
        async (
            targetPage = page,
            targetSearch = search,
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

                const response =
                    await fetch(
                        `/api/products?${params.toString()}`,
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
                    (await response.json()) as ApiResponse<ProductsResponse>;

                if (!response.ok) {
                    throw new Error(
                        result.message ??
                        "Failed to load products.",
                    );
                }

                if (!result.data) {
                    throw new Error(
                        "Invalid products response.",
                    );
                }

                setProducts(
                    result.data.items,
                );

                setPagination(
                    result.data.pagination,
                );
            } catch (err) {
                console.error(
                    "[Products]",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load products.",
                );
            } finally {
                setLoading(false);
            }
        },
        [page, search],
    );

    useEffect(() => {
        void loadProducts();
    }, [loadProducts]);

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

    async function archiveProduct(
        productId: string,
    ) {
        const confirmed =
            window.confirm(
                "Archive this product? It will disappear from the active products list but remain in your records.",
            );

        if (!confirmed) {
            return;
        }

        setArchivingId(productId);
        setError(null);

        try {
            const response =
                await fetch(
                    `/api/products/${productId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Accept:
                                "application/json",
                        },
                    },
                );

            const result =
                (await response.json()) as ApiResponse<{
                    id: string;
                    archived: boolean;
                }>;

            if (!response.ok) {
                throw new Error(
                    result.message ??
                    "Failed to archive product.",
                );
            }

            await loadProducts();
        } catch (err) {
            console.error(
                "[Products archive]",
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to archive product.",
            );
        } finally {
            setArchivingId(null);
        }
    }

    return (
        <div className="mizan-page-enter space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                        Products
                    </p>

                    <h1 className="mizan-page-title mt-1">
                        Product management
                    </h1>

                    <p className="mizan-page-description">
                        Manage your products, pricing,
                        and current stock.
                    </p>
                </div>

                <Link
                    href="/products/new"
                    className="mizan-primary-action shrink-0"
                >
                    <Plus className="h-4 w-4"/>

                    <span className="ml-2">
                        New product
                    </span>
                </Link>
            </section>

            <section className="mizan-card p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"/>

                        <input
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value,
                                )
                            }
                            placeholder="Search products..."
                            aria-label="Search products"
                            className="h-10 pl-9"
                        />
                    </div>

                    <div className="text-xs text-[var(--text-muted)]">
                        {pagination
                            ? `${pagination.total} product${
                                pagination.total ===
                                1
                                    ? ""
                                    : "s"
                            }`
                            : "Loading..."}
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
                            void loadProducts()
                        }
                        className="ml-3 font-semibold underline underline-offset-2"
                    >
                        Retry
                    </button>
                </section>
            ) : null}

            <section className="mizan-dashboard-section overflow-hidden">
                {loading ? (
                    <ProductsLoading/>
                ) : products.length === 0 ? (
                    <ProductsEmpty
                        hasSearch={Boolean(
                            search.trim(),
                        )}
                        onClearSearch={() =>
                            setSearch("")
                        }
                    />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="mizan-table min-w-[900px]">
                                <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Purchase</th>
                                    <th>Selling</th>
                                    <th>Stock</th>
                                    <th>Created</th>
                                    <th className="text-right">
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {products.map(
                                    (
                                        product,
                                    ) => (
                                        <tr
                                            key={
                                                product.id
                                            }
                                        >
                                            <td>
                                                <Link
                                                    href={`/products/${product.id}`}
                                                    className="group flex min-w-0 items-center gap-3"
                                                >
                                                    <ProductAvatar
                                                        name={
                                                            product.name
                                                        }
                                                    />

                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                                                            {
                                                                product.name
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                                                            {
                                                                product.id
                                                            }
                                                        </p>
                                                    </div>
                                                </Link>
                                            </td>

                                            <td>
                                                {product.sku ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {formatMoney(
                                                    product.purchasePrice,
                                                )}
                                            </td>

                                            <td>
                                                {formatMoney(
                                                    product.sellingPrice,
                                                )}
                                            </td>

                                            <td>
                                                <StockBadge
                                                    quantity={
                                                        product.stockQuantity
                                                    }
                                                />
                                            </td>

                                            <td>
                                                {formatDate(
                                                    product.createdAt,
                                                )}
                                            </td>

                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Link
                                                        href={`/products/${product.id}`}
                                                        className="text-xs font-semibold text-[var(--primary)] hover:underline"
                                                    >
                                                        View
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void archiveProduct(
                                                                product.id,
                                                            )
                                                        }
                                                        disabled={
                                                            archivingId ===
                                                            product.id
                                                        }
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--danger)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <Archive className="h-3.5 w-3.5"/>

                                                        {archivingId ===
                                                        product.id
                                                            ? "Archiving..."
                                                            : "Archive"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ),
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="divide-y divide-[var(--border-soft)] md:hidden">
                            {products.map(
                                (
                                    product,
                                ) => (
                                    <div
                                        key={
                                            product.id
                                        }
                                        className="p-4"
                                    >
                                        <Link
                                            href={`/products/${product.id}`}
                                            className="block"
                                        >
                                            <div className="flex items-start gap-3">
                                                <ProductAvatar
                                                    name={
                                                        product.name
                                                    }
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                                {
                                                                    product.name
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                                {product.sku ||
                                                                    "No SKU"}
                                                            </p>
                                                        </div>

                                                        <ChevronRight
                                                            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]"/>
                                                    </div>

                                                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                                        <div>
                                                            <p className="text-[var(--text-muted)]">
                                                                Selling
                                                            </p>

                                                            <p className="mt-0.5 font-semibold text-[var(--text-primary)]">
                                                                {formatMoney(
                                                                    product.sellingPrice,
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[var(--text-muted)]">
                                                                Stock
                                                            </p>

                                                            <div className="mt-1">
                                                                <StockBadge
                                                                    quantity={
                                                                        product.stockQuantity
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void archiveProduct(
                                                    product.id,
                                                )
                                            }
                                            disabled={
                                                archivingId ===
                                                product.id
                                            }
                                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--danger)] disabled:opacity-50"
                                        >
                                            <Archive className="h-3.5 w-3.5"/>

                                            {archivingId ===
                                            product.id
                                                ? "Archiving..."
                                                : "Archive product"}
                                        </button>
                                    </div>
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

function ProductsLoading() {
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

function ProductsEmpty({
                           hasSearch,
                           onClearSearch,
                       }: {
    hasSearch: boolean;
    onClearSearch: () => void;
}) {
    return (
        <div className="mizan-empty min-h-[360px]">
            <div className="mizan-empty-icon">
                <Box className="h-5 w-5"/>
            </div>

            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {hasSearch
                    ? "No products found"
                    : "No products yet"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
                {hasSearch
                    ? "Try a different search term."
                    : "Create your first product to start managing inventory."}
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {hasSearch ? (
                    <button
                        type="button"
                        onClick={onClearSearch}
                        className="mizan-ghost-action"
                    >
                        Clear search
                    </button>
                ) : null}

                <Link
                    href="/products/new"
                    className="mizan-primary-action"
                >
                    <Plus className="h-4 w-4"/>

                    <span className="ml-2">
                        Create product
                    </span>
                </Link>
            </div>
        </div>
    );
}

function ProductAvatar({
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
            .toUpperCase() || "P";

    return (
        <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-xs font-bold text-[var(--primary)]">
            {initials}
        </div>
    );
}

function StockBadge({
                        quantity,
                    }: {
    quantity: number;
}) {
    if (quantity <= 0) {
        return (
            <span
                className="inline-flex rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--danger)]">
                Out of stock
            </span>
        );
    }

    if (quantity <= 5) {
        return (
            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                {quantity} left
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            {quantity} in stock
        </span>
    );
}

function Pagination({
                        pagination,
                        onPageChange,
                    }: {
    pagination:
        | ProductsResponse["pagination"]
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
                    className="mizan-ghost-action px-3"
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
                    className="mizan-ghost-action px-3"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4"/>
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