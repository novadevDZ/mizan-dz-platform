"use client";

import {
    ArrowDownToLine,
    ArrowUpFromLine,
    ClipboardCheck,
    SlidersHorizontal,
} from "lucide-react";

type Movement = {
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

type Props = {
    items: Movement[];
    loading?: boolean;
};

function formatNumber(value: number) {
    return new Intl.NumberFormat(
        "en-DZ",
    ).format(value);
}

function formatCurrency(
    value: number | null,
) {
    if (value === null) {
        return "—";
    }

    return new Intl.NumberFormat(
        "en-DZ",
        {
            style: "currency",
            currency: "DZD",
            maximumFractionDigits: 2,
        },
    ).format(value);
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat(
        "en-DZ",
        {
            dateStyle: "medium",
            timeStyle: "short",
        },
    ).format(new Date(value));
}

function getMovementLabel(
    type: string,
) {
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

function getMovementClass(
    type: string,
) {
    switch (type) {
        case "purchase":
        case "return_in":
        case "adjustment_in":
            return "bg-emerald-50 text-emerald-700";

        case "sale":
        case "return_out":
        case "adjustment_out":
            return "bg-red-50 text-red-700";

        case "stock_count":
            return "bg-amber-50 text-amber-700";

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
                <ArrowDownToLine className="size-3.5" />
            );

        case "sale":
        case "return_out":
        case "adjustment_out":
            return (
                <ArrowUpFromLine className="size-3.5" />
            );

        case "stock_count":
            return (
                <ClipboardCheck className="size-3.5" />
            );

        default:
            return (
                <SlidersHorizontal className="size-3.5" />
            );
    }
}

export default function ProductInventoryMovementTable({
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
                                className="px-4 py-3 text-left font-medium"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {Array.from({
                        length: 6,
                    }).map((_, row) => (
                        <tr
                            key={row}
                            className="border-b"
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
            <div className="flex min-h-[300px] items-center justify-center p-8">
                <div className="text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
                        <ClipboardCheck className="size-6 text-muted-foreground" />
                    </div>

                    <h3 className="mt-4 font-semibold">
                        No inventory movements
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                        No movements have been recorded for this product.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
                <thead>
                <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium">
                        Movement
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Quantity
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Before
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        After
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Unit Cost
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Reference
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Reason
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                        Date
                    </th>
                </tr>
                </thead>

                <tbody>
                {items.map((item) => {
                    const positive =
                        item.quantityChange > 0;

                    return (
                        <tr
                            key={item.id}
                            className="border-b last:border-0 hover:bg-muted/20"
                        >
                            <td className="px-4 py-4">
                                    <span
                                        className={[
                                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                            getMovementClass(
                                                item.type,
                                            ),
                                        ].join(" ")}
                                    >
                                        <MovementIcon
                                            type={
                                                item.type
                                            }
                                        />

                                        {getMovementLabel(
                                            item.type,
                                        )}
                                    </span>
                            </td>

                            <td className="px-4 py-4 font-semibold">
                                    <span
                                        className={
                                            positive
                                                ? "text-emerald-600"
                                                : item.quantityChange <
                                                0
                                                    ? "text-red-600"
                                                    : "text-muted-foreground"
                                        }
                                    >
                                        {positive
                                            ? "+"
                                            : ""}
                                        {formatNumber(
                                            item.quantityChange,
                                        )}
                                    </span>

                                {Math.abs(
                                        item.quantity,
                                    ) !==
                                    Math.abs(
                                        item.quantityChange,
                                    ) && (
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            Movement quantity:{" "}
                                            {formatNumber(
                                                item.quantity,
                                            )}
                                        </div>
                                    )}
                            </td>

                            <td className="px-4 py-4">
                                {formatNumber(
                                    item.balanceBefore,
                                )}
                            </td>

                            <td className="px-4 py-4 font-semibold">
                                {formatNumber(
                                    item.balanceAfter,
                                )}
                            </td>

                            <td className="px-4 py-4 text-muted-foreground">
                                {formatCurrency(
                                    item.unitCost,
                                )}
                            </td>

                            <td className="px-4 py-4">
                                <div className="font-medium">
                                    {item.referenceNumber ||
                                        "—"}
                                </div>

                                {item.referenceType && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {
                                            item.referenceType
                                        }
                                    </div>
                                )}
                            </td>

                            <td className="max-w-[240px] px-4 py-4 text-muted-foreground">
                                <div className="truncate">
                                    {item.reason ||
                                        "—"}
                                </div>
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                                {formatDate(
                                    item.createdAt,
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}