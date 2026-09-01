"use client";

import {
    Check,
    ChevronsUpDown,
    Loader2,
    Search,
} from "lucide-react";
import {useEffect, useRef, useState} from "react";

import type {InventoryProduct} from "./inventory-types";

type ProductApiResponse = {
    data?: unknown;
    items?: InventoryProduct[];
};

type Props = {
    value: string;
    onChange: (
        productId: string,
        product: InventoryProduct | null,
    ) => void;
    disabled?: boolean;
};

function normalizeProducts(
    payload: ProductApiResponse,
): InventoryProduct[] {
    const root = payload?.data ?? payload;

    if (Array.isArray(root)) {
        return root as InventoryProduct[];
    }

    if (
        typeof root === "object" &&
        root !== null &&
        "items" in root &&
        Array.isArray(
            (root as { items: unknown }).items,
        )
    ) {
        return (
            root as {
                items: InventoryProduct[];
            }
        ).items;
    }

    if (Array.isArray(payload?.items)) {
        return payload.items;
    }

    return [];
}

export default function InventoryProductSelector({
                                                     value,
                                                     onChange,
                                                     disabled = false,
                                                 }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState<
        InventoryProduct[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(
        null,
    );

    const containerRef = useRef<HTMLDivElement>(null);

    const selectedProduct =
        products.find(
            (product) => product.id === value,
        ) ?? null;

    useEffect(() => {
        function handleOutside(event: MouseEvent) {
            const target = event.target;

            if (
                target instanceof Node &&
                !containerRef.current?.contains(target)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleOutside,
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutside,
            );
        };
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        const controller = new AbortController();

        const timer = window.setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    page: "1",
                    limit: "100",
                });

                const trimmedQuery = query.trim();

                if (trimmedQuery) {
                    params.set(
                        "search",
                        trimmedQuery,
                    );
                }

                const response = await fetch(
                    `/api/products?${params.toString()}`,
                    {
                        cache: "no-store",
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error(
                        "Unable to load products.",
                    );
                }

                const payload =
                    (await response.json()) as ProductApiResponse;

                setProducts(
                    normalizeProducts(payload),
                );
            } catch (err) {
                if (
                    err instanceof DOMException &&
                    err.name === "AbortError"
                ) {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load products.",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }, 250);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [open, query]);

    function handleSelect(
        product: InventoryProduct,
    ) {
        onChange(product.id, product);
        setOpen(false);
        setQuery("");
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full min-w-0"
        >
            <button
                type="button"
                disabled={disabled}
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() =>
                    setOpen((current) => !current)
                }
                className="flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg border bg-background px-3 text-sm text-left outline-none transition-colors hover:bg-muted/30 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span
                    className={[
                        "min-w-0 flex-1 truncate",
                        selectedProduct
                            ? "font-medium"
                            : "text-muted-foreground",
                    ].join(" ")}
                >
                    {selectedProduct
                        ? `${selectedProduct.name}${
                            selectedProduct.sku
                                ? ` — ${selectedProduct.sku}`
                                : ""
                        }`
                        : "Select a product"}
                </span>

                <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground"/>
            </button>

            {open && (
                <div
                    className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-xl">
                    <div className="border-b p-3">
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>

                            <input
                                autoFocus
                                type="search"
                                value={query}
                                onChange={(event) =>
                                    setQuery(
                                        event.target.value,
                                    )
                                }
                                placeholder="Search products..."
                                aria-label="Search products"
                                className="h-10 w-full rounded-lg border bg-background px-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div
                        className="max-h-72 overflow-y-auto p-1"
                        role="listbox"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                                <Loader2 className="size-4 animate-spin"/>
                                Loading products...
                            </div>
                        ) : error ? (
                            <div className="p-4 text-sm text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="p-6 text-center text-sm text-muted-foreground">
                                No products found.
                            </div>
                        ) : (
                            products.map((product) => {
                                const selected =
                                    value ===
                                    product.id;

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        role="option"
                                        aria-selected={
                                            selected
                                        }
                                        onClick={() =>
                                            handleSelect(
                                                product,
                                            )
                                        }
                                        className={[
                                            "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                                            selected
                                                ? "bg-muted"
                                                : "hover:bg-muted",
                                        ].join(" ")}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-medium">
                                                {
                                                    product.name
                                                }
                                            </div>

                                            <div
                                                className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                                <span className="truncate">
                                                    {product.sku ||
                                                        "No SKU"}
                                                </span>

                                                <span
                                                    aria-hidden="true"
                                                >
                                                    •
                                                </span>

                                                <span className="whitespace-nowrap">
                                                    Stock:{" "}
                                                    {
                                                        product.stockQuantity
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {selected && (
                                            <Check className="size-4 shrink-0 text-primary"/>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}