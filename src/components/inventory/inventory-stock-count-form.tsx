"use client";

import {
    ClipboardCheck,
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

export default function InventoryStockCountForm({
                                                    onSuccess,
                                                }: Props) {
    const [productId, setProductId] =
        useState("");

    const [selectedProduct, setSelectedProduct] =
        useState<InventoryProduct | null>(null);

    const [
        countedQuantity,
        setCountedQuantity,
    ] = useState("");

    const [reason, setReason] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState<string | null>(null);

    const systemQuantity =
        selectedProduct?.stockQuantity ?? null;

    const counted =
        countedQuantity === ""
            ? null
            : Number(countedQuantity);

    const difference =
        counted === null ||
        systemQuantity === null
            ? null
            : counted - systemQuantity;

    const reset = () => {
        setProductId("");
        setSelectedProduct(null);
        setCountedQuantity("");
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

        const parsedCount =
            Number(countedQuantity);

        if (!productId) {
            setError(
                "Please select a product first.",
            );

            return;
        }

        if (
            !Number.isInteger(parsedCount) ||
            parsedCount < 0
        ) {
            setError(
                "Counted quantity must be a non-negative integer.",
            );

            return;
        }

        try {
            setLoading(true);

            const response =
                await fetch(
                    "/api/inventory/stock-count",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            productId,
                            countedQuantity:
                            parsedCount,
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
                    "Stock count failed.",
                );
            }

            setSuccess(
                parsedCount === systemQuantity
                    ? "The physical count matches the system stock."
                    : "The stock count difference was recorded successfully.",
            );

            setCountedQuantity("");
            setReason("");

            onSuccess?.();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Stock count failed.",
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
            <div>
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
            </div>

            {selectedProduct && (
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">
                            System Stock
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {systemQuantity}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">
                            Physical Count
                        </p>

                        <input
                            type="number"
                            min={0}
                            step={1}
                            value={countedQuantity}
                            disabled={loading}
                            onChange={(
                                event,
                            ) =>
                                setCountedQuantity(
                                    event.target.value,
                                )
                            }
                            placeholder="0"
                            className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">
                            Difference
                        </p>

                        <p
                            className={[
                                "mt-2 text-2xl font-semibold",
                                difference ===
                                null
                                    ? ""
                                    : difference > 0
                                        ? "text-emerald-600"
                                        : difference < 0
                                            ? "text-red-600"
                                            : "text-muted-foreground",
                            ].join(" ")}
                        >
                            {difference ===
                            null
                                ? "—"
                                : difference > 0
                                    ? `+${difference}`
                                    : difference}
                        </p>
                    </div>
                </div>
            )}

            <div>
                <label
                    htmlFor="stock-count-reason"
                    className="mb-2 block text-sm font-medium"
                >
                    Count Note
                </label>

                <textarea
                    id="stock-count-reason"
                    value={reason}
                    disabled={loading}
                    onChange={(event) =>
                        setReason(
                            event.target.value,
                        )
                    }
                    placeholder="e.g. Monthly warehouse stock count"
                    rows={4}
                    className="w-full resize-none rounded-lg border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {difference !== null &&
                difference !== 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        A stock difference of{" "}
                        <strong>
                            {difference > 0
                                ? `+${difference}`
                                : difference}
                        </strong>{" "}
                        will be recorded as a stock count adjustment.
                    </div>
                )}

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
                    disabled={
                        loading ||
                        !selectedProduct
                    }
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <ClipboardCheck className="size-4" />
                    )}

                    Record Stock Count
                </button>
            </div>
        </form>
    );
}