"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Box,
    Loader2,
    Save,
} from "lucide-react";
import { useState } from "react";

type ProductFormProps = {
    mode: "create" | "edit";
    initialData?: {
        id?: string;
        name: string;
        sku: string | null;
        description: string | null;
        purchasePrice: string;
        sellingPrice: string;
        stockQuantity: number;
    };
};

export default function ProductForm({
                                        mode,
                                        initialData,
                                    }: ProductFormProps) {
    const router = useRouter();

    const [name, setName] =
        useState(initialData?.name ?? "");

    const [sku, setSku] =
        useState(initialData?.sku ?? "");

    const [description, setDescription] =
        useState(
            initialData?.description ?? "",
        );

    const [purchasePrice, setPurchasePrice] =
        useState(
            initialData?.purchasePrice ?? "",
        );

    const [sellingPrice, setSellingPrice] =
        useState(
            initialData?.sellingPrice ?? "",
        );

    const [stockQuantity, setStockQuantity] =
        useState(
            String(
                initialData?.stockQuantity ?? 0,
            ),
        );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const trimmedName =
            name.trim();

        const normalizedPurchasePrice =
            Number(purchasePrice);

        const normalizedSellingPrice =
            Number(sellingPrice);

        const normalizedStock =
            Number(stockQuantity);

        if (!trimmedName) {
            setError(
                "Product name is required.",
            );
            return;
        }

        if (
            !Number.isFinite(
                normalizedPurchasePrice,
            ) ||
            normalizedPurchasePrice < 0
        ) {
            setError(
                "Purchase price must be a valid non-negative number.",
            );
            return;
        }

        if (
            !Number.isFinite(
                normalizedSellingPrice,
            ) ||
            normalizedSellingPrice < 0
        ) {
            setError(
                "Selling price must be a valid non-negative number.",
            );
            return;
        }

        if (
            !Number.isInteger(
                normalizedStock,
            ) ||
            normalizedStock < 0
        ) {
            setError(
                "Stock quantity must be a non-negative integer.",
            );
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const endpoint =
                mode === "create"
                    ? "/api/products"
                    : `/api/products/${initialData?.id}`;

            const method =
                mode === "create"
                    ? "POST"
                    : "PATCH";

            const response =
                await fetch(endpoint, {
                    method,
                    headers: {
                        "Content-Type":
                            "application/json",
                        Accept:
                            "application/json",
                    },
                    body: JSON.stringify({
                        name: trimmedName,
                        sku:
                            sku.trim() ||
                            null,
                        description:
                            description.trim() ||
                            null,
                        purchasePrice:
                        normalizedPurchasePrice,
                        sellingPrice:
                        normalizedSellingPrice,
                        stockQuantity:
                        normalizedStock,
                    }),
                });

            const result =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ??
                    "Failed to save product.",
                );
            }

            router.push(
                mode === "create"
                    ? "/products"
                    : `/products/${initialData?.id}`,
            );

            router.refresh();
        } catch (err) {
            console.error(
                "[ProductForm]",
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save product.",
            );
        } finally {
            setLoading(false);
        }
    }

    const backHref =
        mode === "edit" &&
        initialData?.id
            ? `/products/${initialData.id}`
            : "/products";

    return (
        <div className="mizan-page-enter mx-auto max-w-3xl space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <Link
                        href={backHref}
                        className="inline-flex items-center text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />

                        Back to products
                    </Link>

                    <div className="mt-3 flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                            <Box className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <h1 className="mizan-page-title">
                                {mode === "create"
                                    ? "New product"
                                    : "Edit product"}
                            </h1>

                            <p className="mizan-page-description">
                                {mode === "create"
                                    ? "Add a product to your Mizan inventory."
                                    : "Update product information, pricing, and stock."}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <form
                onSubmit={handleSubmit}
                className="mizan-card p-5 sm:p-7"
            >
                {error ? (
                    <div
                        role="alert"
                        className="mb-6 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"
                    >
                        {error}
                    </div>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label
                            htmlFor="product-name"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Product name
                        </label>

                        <input
                            id="product-name"
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value,
                                )
                            }
                            placeholder="e.g. Samsung Galaxy A55"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="product-sku"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            SKU
                        </label>

                        <input
                            id="product-sku"
                            value={sku}
                            onChange={(event) =>
                                setSku(
                                    event.target.value,
                                )
                            }
                            placeholder="e.g. SAM-A55-256"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="product-stock"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Stock quantity
                        </label>

                        <input
                            id="product-stock"
                            type="number"
                            min="0"
                            step="1"
                            value={stockQuantity}
                            onChange={(event) =>
                                setStockQuantity(
                                    event.target.value,
                                )
                            }
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="product-purchase-price"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Purchase price
                        </label>

                        <input
                            id="product-purchase-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={purchasePrice}
                            onChange={(event) =>
                                setPurchasePrice(
                                    event.target.value,
                                )
                            }
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="product-selling-price"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Selling price
                        </label>

                        <input
                            id="product-selling-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={sellingPrice}
                            onChange={(event) =>
                                setSellingPrice(
                                    event.target.value,
                                )
                            }
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="product-description"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Description
                        </label>

                        <textarea
                            id="product-description"
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value,
                                )
                            }
                            rows={5}
                            placeholder="Internal product description..."
                        />
                    </div>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-2 border-t border-[var(--border-soft)] pt-5 sm:flex-row sm:justify-end">
                    <Link
                        href={backHref}
                        className="mizan-ghost-action"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mizan-primary-action"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}

                        <span className="ml-2">
                            {loading
                                ? "Saving..."
                                : mode === "create"
                                    ? "Create product"
                                    : "Save changes"}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}