import {
    Boxes,
    DollarSign,
    ShoppingBag,
    AlertTriangle,
} from "lucide-react";

type Props = {
    summary: {
        currentStock: number;
        reorderLevel: number;
        stockValue: number;
        retailValue: number;
    };
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

export default function ProductInventorySummary({
                                                    summary,
                                                }: Props) {
    const isLowStock =
        summary.currentStock <=
        summary.reorderLevel;

    const cards = [
        {
            title: "Current Stock",
            value: formatNumber(
                summary.currentStock,
            ),
            icon: Boxes,
            warning: isLowStock,
        },
        {
            title: "Reorder Level",
            value: formatNumber(
                summary.reorderLevel,
            ),
            icon: AlertTriangle,
            warning: false,
        },
        {
            title: "Stock Value",
            value: formatCurrency(
                summary.stockValue,
            ),
            icon: DollarSign,
            warning: false,
        },
        {
            title: "Retail Value",
            value: formatCurrency(
                summary.retailValue,
            ),
            icon: ShoppingBag,
            warning: false,
        },
    ];

    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.title}
                        className="rounded-xl border bg-card p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {card.title}
                            </p>

                            <Icon
                                className={
                                    card.warning
                                        ? "size-4 text-amber-600"
                                        : "size-4 text-muted-foreground"
                                }
                            />
                        </div>

                        <div className="mt-3 flex items-end gap-2">
                            <span className="text-2xl font-semibold">
                                {card.value}
                            </span>

                            {card.warning && (
                                <span className="mb-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                                    Low Stock
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </section>
    );
}