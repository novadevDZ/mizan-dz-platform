"use client";

import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Loader2,
    RotateCcw,
} from "lucide-react";
import {
    FormEvent,
    useState,
} from "react";

import InventoryProductSelector from "./inventory-product-selector";
import type { InventoryProduct } from "./inventory-types";

type Props = {
    onSuccess?: () => void;
};

export default function InventoryAdjustmentForm({
                                                    onSuccess,
                                                }: Props) {
    const [productId, setProductId] =
        useState("");

    const [selectedProduct, setSelectedProduct] =
        useState<InventoryProduct | null>(null);

    const [direction, setDirection] =
        useState<"in" | "out">("in");

    const [quantity, setQuantity] =
        useState("");

    const [reason, setReason] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState<string | null>(null);

    const reset = () => {
        setProductId("");
        setSelectedProduct(null);
        setDirection("in");
        setQuantity("");
        setReason("");
        setError(null);
        setSuccess(null);
    };

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError(null);
        setSuccess(null);

        const parsedQuantity =
            Number(quantity);

        if (!productId) {
            setError(
                "Please select a product first.",
            );

            return;
        }

        if (
            !Number.isInteger(parsedQuantity) ||
            parsedQuantity <= 0
        ) {
            setError(
                "Quantity must be a positive integer.",
            );

            return;
        }

        if (!reason.trim()) {
            setError(
                "An adjustment reason is required.",
            );

            return;
        }

        if (
            direction === "out" &&
            selectedProduct &&
            parsedQuantity >
            selectedProduct.stockQuantity
        ) {
            setError(
                "The requested quantity is greater than the current stock.",
            );

            return;
        }

        try {
            setLoading(true);

            const response =
                await fetch(
                    "/api/inventory/adjustments",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            productId,
                            direction,
                            quantity:
                            parsedQuantity,
                            reason:
                                reason.trim(),
                        }),
                    },
                );

            const payload =
                (await response.json()) as {
                    message?: string;
                    error?: string;
                };

            if (!response.ok) {
                throw new Error(
                    payload.message ||
                    payload.error ||
                    "Stock adjustment failed.",
                );
            }

            setSuccess(
                direction === "in"
                    ? "Stock was increased successfully."
                    : "Stock was decreased successfully.",
            );

            setQuantity("");
            setReason("");

            onSuccess?.();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Stock adjustment failed.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            dir="ltr"
            className="space-y-6"
        >
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                        Product
                    </label>

                    <InventoryProductSelector
                        value={productId}
                        disabled={loading}
                        onChange={(
                            value,
                            product,
                        ) => {
                            setProductId(value);
                            setSelectedProduct(
                                product,
                            );
                        }}
                    />

                    {selectedProduct && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            Current stock:{" "}
                            <span className="font-semibold text-foreground">
                                {
                                    selectedProduct.stockQuantity
                                }
                            </span>
                        </div>
                    )}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Movement Type
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                                setDirection("in")
                            }
                            className={[
                                "flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition",
                                direction === "in"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "hover:bg-muted",
                            ].join(" ")}
                        >
                            <ArrowDownToLine className="size-4" />
                            Stock In
                        </button>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                                setDirection("out")
                            }
                            className={[
                                "flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition",
                                direction === "out"
                                    ? "border-red-500 bg-red-50 text-red-700"
                                    : "hover:bg-muted",
                            ].join(" ")}
                        >
                            <ArrowUpFromLine className="size-4" />
                            Stock Out
                        </button>
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="adjustment-quantity"
                        className="mb-2 block text-sm font-medium"
                    >
                        Quantity
                    </label>

                    <input
                        id="adjustment-quantity"
                        type="number"
                        min={1}
                        step={1}
                        value={quantity}
                        disabled={loading}
                        onChange={(event) =>
                            setQuantity(
                                event.target.value,
                            )
                        }
                        placeholder="e.g. 10"
                        className="h-12 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="lg:col-span-2">
                    <label
                        htmlFor="adjustment-reason"
                        className="mb-2 block text-sm font-medium"
                    >
                        Reason
                    </label>

                    <textarea
                        id="adjustment-reason"
                        value={reason}
                        disabled={loading}
                        onChange={(event) =>
                            setReason(
                                event.target.value,
                            )
                        }
                        placeholder="Describe why the stock is being adjusted..."
                        rows={4}
                        className="w-full resize-none rounded-lg border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                </div>
            )}

            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    disabled={loading}
                    onClick={reset}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                >
                    <RotateCcw className="size-4" />
                    Reset
                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading && (
                        <Loader2 className="size-4 animate-spin" />
                    )}

                    Record Movement
                </button>
            </div>
        </form>
    );
}