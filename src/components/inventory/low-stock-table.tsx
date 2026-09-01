"use client";

import Link from "next/link";
import {
    AlertTriangle,
    ArrowRight,
    Package,
    PackageX,
} from "lucide-react";

export type LowStockItem = {
    id: string;
    name: string;
    sku: string | null;
    description: string | null;
    purchasePrice: number;
    sellingPrice: number;
    stockQuantity: number;
    reorderLevel: number;
    shortage: number;
    status:
        | "out_of_stock"
        | "critical"
        | "low_stock";
    stockPercentage: number;
    createdAt: string;
    updatedAt: string;
};

type Props = {
    items: LowStockItem[];
    loading?: boolean;
};

function formatNumber(value: number) {
    return new Intl.NumberFormat(
        "en-DZ",
    ).format(value);
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat(
        "en-DZ",
        {
            style: "currency",
            currency: "DZD",
            maximumFractionDigits: 2,
        },
    ).format(value);
}

function getStatusLabel(
    status: LowStockItem["status"],
) {
    switch (status) {
        case "out_of_stock":
            return "Out of Stock";

        case "critical":
            return "Critical";

        case "low_stock":
            return "Low Stock";
    }
}

function getStatusClasses(
    status: LowStockItem["status"],
) {
    switch (status) {
        case "out_of_stock":
            return "bg-red-50 text-red-700";

        case "critical":
            return "bg-orange-50 text-orange-700";

        case "low_stock":
            return "bg-amber-50 text-amber-700";
    }
}

function StatusIcon({
                        status,
                    }: {
    status: LowStockItem["status"];
}) {
    if (status === "out_of_stock") {
        return (
            <PackageX className="size-3.5" />
        );
    }

    if (status === "critical") {
        return (
            <AlertTriangle className="size-3.5" />
        );
    }

    return (
        <Package className="size-3.5" />
    );
}

export default function LowStockTable({
                                          items,
                                          loading = false,
                                      }: Props) {
    if (loading) {
        return (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                    <thead>
                    <tr className="border-b bg-muted/40">
                        {[
                            "Product",
                            "SKU",
                            "Stock",
                            "Reorder Level",
                            "Shortage",
                            "Purchase Value",
                            "Status",
                            "Action",
                        ].map((header) => (
                            <th
                                key={header}
                                className="px-4 py-3 text-left font-medium"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {Array.from({
                        length: 8,
                    }).map((_, row) => (
                        <tr
                            key={row}
                            className="border-b last:border-0"
                        >
                            {Array.from({
                                length: 8,
                            }).map(
                                (_, cell) => (
                                    <td
                                        key={cell}
                                        className="px-4 py-4"
                                    >
                                        <div className="h-5 animate-pulse rounded bg-muted" />
                                    </td>
                                ),
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex min-h-[360px] items-center justify-center p-8">
                <div className="text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-50">
                        <Package className="size-6 text-emerald-600" />
                    </div>

                    <h3 className="mt-4 font-semibold">
                        Inventory is healthy
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                        No products currently require
                        replenishment.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
                <thead>
                <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium">
                        Product
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        SKU
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Current Stock
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Reorder Level
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Shortage
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Stock Value
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Status
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Action
                    </th>
                </tr>
                </thead>

                <tbody>
                {items.map((item) => (
                    <tr
                        key={item.id}
                        className="border-b last:border-0 hover:bg-muted/20"
                    >
                        <td className="px-4 py-4">
                            <div className="font-medium">
                                {item.name}
                            </div>

                            {item.description && (
                                <div className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">
                                    {item.description}
                                </div>
                            )}
                        </td>

                        <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                            {item.sku ||
                                "No SKU"}
                        </td>

                        <td className="px-4 py-4">
                            <div className="font-semibold">
                                {formatNumber(
                                    item.stockQuantity,
                                )}
                            </div>

                            <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={[
                                        "h-full rounded-full",
                                        item.status ===
                                        "out_of_stock"
                                            ? "w-0 bg-red-500"
                                            : item.status ===
                                            "critical"
                                                ? "bg-orange-500"
                                                : "bg-amber-500",
                                    ].join(" ")}
                                    style={{
                                        width:
                                            item.status ===
                                            "out_of_stock"
                                                ? "0%"
                                                : `${Math.min(
                                                    item.stockPercentage,
                                                    100,
                                                )}%`,
                                    }}
                                />
                            </div>
                        </td>

                        <td className="px-4 py-4">
                            {formatNumber(
                                item.reorderLevel,
                            )}
                        </td>

                        <td className="px-4 py-4">
                                <span className="font-semibold text-red-600">
                                    {formatNumber(
                                        item.shortage,
                                    )}
                                </span>
                        </td>

                        <td className="px-4 py-4">
                            {formatCurrency(
                                item.purchasePrice *
                                item.stockQuantity,
                            )}
                        </td>

                        <td className="px-4 py-4">
                                <span
                                    className={[
                                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                        getStatusClasses(
                                            item.status,
                                        ),
                                    ].join(" ")}
                                >
                                    <StatusIcon
                                        status={
                                            item.status
                                        }
                                    />

                                    {getStatusLabel(
                                        item.status,
                                    )}
                                </span>
                        </td>

                        <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/products/${item.id}/inventory`}
                                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                                >
                                    Inventory
                                    <ArrowRight className="size-3.5" />
                                </Link>

                                <Link
                                    href={`/products/${item.id}`}
                                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                >
                                    Product
                                </Link>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}