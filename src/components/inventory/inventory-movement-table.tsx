"use client";

import {
    ArrowDownToLine,
    ArrowUpFromLine,
    ClipboardCheck,
    SlidersHorizontal,
} from "lucide-react";

import type {InventoryMovement} from "./inventory-types";

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-DZ").format(value);
}

function formatCurrency(value: number | null) {
    if (value === null) {
        return "—";
    }

    return new Intl.NumberFormat("en-DZ", {
        style: "currency",
        currency: "DZD",
        maximumFractionDigits: 2,
    }).format(value);
}

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-DZ", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function getMovementLabel(type: string) {
    switch (type) {
        case "purchase":
            return "Purchase";

        case "sale":
            return "Sale";

        case "return_in":
            return "Return In";

        case "return_out":
            return "Return Out";

        case "adjustment_in":
            return "Adjustment In";

        case "adjustment_out":
            return "Adjustment Out";

        case "stock_count":
            return "Stock Count";

        default:
            return type;
    }
}

function getMovementClasses(type: string) {
    switch (type) {
        case "purchase":
        case "return_in":
        case "adjustment_in":
            return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";

        case "sale":
        case "return_out":
        case "adjustment_out":
            return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400";

        case "stock_count":
            return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";

        default:
            return "bg-muted text-muted-foreground";
    }
}

function MovementIcon({
                          type,
                      }: {
    type: string;
}) {
    switch (type) {
        case "purchase":
        case "return_in":
        case "adjustment_in":
            return (
                <ArrowDownToLine className="size-3.5 shrink-0" />
            );

        case "sale":
        case "return_out":
        case "adjustment_out":
            return (
                <ArrowUpFromLine className="size-3.5 shrink-0" />
            );

        case "stock_count":
            return (
                <ClipboardCheck className="size-3.5 shrink-0" />
            );

        default:
            return (
                <SlidersHorizontal className="size-3.5 shrink-0" />
            );
    }
}

function MovementBadge({
                           type,
                       }: {
    type: string;
}) {
    return (
        <span
            className={[
                "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                getMovementClasses(type),
            ].join(" ")}
        >
            <MovementIcon type={type} />

            <span className="truncate">
                {getMovementLabel(type)}
            </span>
        </span>
    );
}

function QuantityValue({
                           movement,
                       }: {
    movement: InventoryMovement;
}) {
    const positive = movement.quantityChange > 0;
    const negative = movement.quantityChange < 0;

    return (
        <span
            className={[
                "font-semibold tabular-nums",
                positive
                    ? "text-emerald-600"
                    : negative
                        ? "text-red-600"
                        : "text-muted-foreground",
            ].join(" ")}
        >
            {positive ? "+" : ""}
            {formatNumber(movement.quantityChange)}
        </span>
    );
}

type Props = {
    items: InventoryMovement[];
    loading?: boolean;
};

function LoadingState() {
    return (
        <div className="inventory-table-scroll w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                <tr className="border-b bg-muted/40">
                    {[
                        "Product",
                        "Movement",
                        "Quantity",
                        "Before",
                        "After",
                        "Unit Cost",
                        "Reference",
                        "Reason",
                        "Date",
                    ].map((header) => (
                        <th
                            key={header}
                            className="whitespace-nowrap px-4 py-3 text-left font-medium"
                        >
                            {header}
                        </th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {Array.from({length: 8}).map((_, row) => (
                    <tr
                        key={row}
                        className="border-b last:border-0"
                    >
                        {Array.from({length: 9}).map(
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

function EmptyState() {
    return (
        <div className="flex min-h-[320px] items-center justify-center p-8">
            <div className="max-w-sm text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
                    <ClipboardCheck className="size-6 text-muted-foreground" />
                </div>

                <h3 className="mt-4 font-semibold">
                    No inventory movements
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                    No inventory movements match the current search.
                </p>
            </div>
        </div>
    );
}

export default function InventoryMovementTable({
                                                   items,
                                                   loading = false,
                                               }: Props) {
    if (loading) {
        return <LoadingState />;
    }

    if (items.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="inventory-table-scroll w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead>
                <tr className="border-b bg-muted/40">
                    <th className="w-[220px] whitespace-nowrap px-4 py-3 font-medium">
                        Product
                    </th>

                    <th className="w-[130px] whitespace-nowrap px-4 py-3 font-medium">
                        Movement
                    </th>

                    <th className="w-[140px] whitespace-nowrap px-4 py-3 text-right font-medium">
                        Quantity
                    </th>

                    <th className="w-[90px] whitespace-nowrap px-4 py-3 text-right font-medium">
                        Before
                    </th>

                    <th className="w-[90px] whitespace-nowrap px-4 py-3 text-right font-medium">
                        After
                    </th>

                    <th className="w-[120px] whitespace-nowrap px-4 py-3 text-right font-medium">
                        Unit Cost
                    </th>

                    <th className="w-[180px] whitespace-nowrap px-4 py-3 font-medium">
                        Reference
                    </th>

                    <th className="w-[220px] whitespace-nowrap px-4 py-3 font-medium">
                        Reason
                    </th>

                    <th className="w-[170px] whitespace-nowrap px-4 py-3 font-medium">
                        Date
                    </th>
                </tr>
                </thead>

                <tbody>
                {items.map((item) => (
                    <tr
                        key={item.id}
                        className="border-b transition-colors last:border-0 hover:bg-muted/20"
                    >
                        <td className="px-4 py-4 align-top">
                            <div
                                title={item.productName}
                                className="max-w-[220px] truncate font-medium"
                            >
                                {item.productName}
                            </div>

                            <div
                                title={item.sku || "No SKU"}
                                className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground"
                            >
                                {item.sku || "No SKU"}
                            </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                            <MovementBadge type={item.type} />
                        </td>

                        <td className="px-4 py-4 text-right align-top">
                            <QuantityValue movement={item} />

                            {Math.abs(item.quantity) !==
                                Math.abs(
                                    item.quantityChange,
                                ) && (
                                    <div className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                                        Qty:{" "}
                                        {formatNumber(
                                            item.quantity,
                                        )}
                                    </div>
                                )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right align-top tabular-nums">
                            {formatNumber(
                                item.balanceBefore,
                            )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right align-top font-semibold tabular-nums">
                            {formatNumber(
                                item.balanceAfter,
                            )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right align-top text-muted-foreground">
                            {formatCurrency(
                                item.unitCost,
                            )}
                        </td>

                        <td className="px-4 py-4 align-top">
                            <div
                                title={
                                    item.referenceNumber ||
                                    undefined
                                }
                                className="max-w-[180px] truncate font-medium"
                            >
                                {item.referenceNumber ||
                                    "—"}
                            </div>

                            {item.referenceType && (
                                <div
                                    title={
                                        item.referenceType
                                    }
                                    className="mt-1 max-w-[180px] truncate text-xs text-muted-foreground"
                                >
                                    {
                                        item.referenceType
                                    }
                                </div>
                            )}
                        </td>

                        <td className="px-4 py-4 align-top text-muted-foreground">
                            <div
                                title={
                                    item.reason ||
                                    undefined
                                }
                                className="max-w-[220px] truncate"
                            >
                                {item.reason || "—"}
                            </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 align-top text-muted-foreground">
                            <time
                                dateTime={
                                    item.createdAt
                                }
                                title={formatDate(
                                    item.createdAt,
                                )}
                                className="text-xs"
                            >
                                {formatDate(
                                    item.createdAt,
                                )}
                            </time>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}