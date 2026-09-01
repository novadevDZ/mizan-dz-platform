import {
    AlertTriangle,
    Boxes,
    PackageX,
    TriangleAlert,
} from "lucide-react";

type Props = {
    total: number;
    outOfStock: number;
    critical: number;
    lowStock: number;
};

export default function LowStockSummary({
                                            total,
                                            outOfStock,
                                            critical,
                                            lowStock,
                                        }: Props) {
    const cards = [
        {
            title: "Low Stock Products",
            value: total,
            icon: Boxes,
            className:
                "text-amber-600",
        },
        {
            title: "Out of Stock",
            value: outOfStock,
            icon: PackageX,
            className:
                "text-red-600",
        },
        {
            title: "Critical Stock",
            value: critical,
            icon: TriangleAlert,
            className:
                "text-orange-600",
        },
        {
            title: "Needs Reordering",
            value: lowStock,
            icon: AlertTriangle,
            className:
                "text-yellow-600",
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
                                className={`size-5 ${card.className}`}
                            />
                        </div>

                        <p className="mt-3 text-2xl font-semibold">
                            {new Intl.NumberFormat(
                                "en-DZ",
                            ).format(card.value)}
                        </p>
                    </div>
                );
            })}
        </section>
    );
}