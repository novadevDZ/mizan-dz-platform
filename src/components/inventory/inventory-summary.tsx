import {
    Activity,
    ArrowDownToLine,
    ArrowUpFromLine,
    Boxes,
} from "lucide-react";

type Props = {
    movementCount: number;
    totalIn: number;
    totalOut: number;
    latestBalance: number | null;
};

const cards = ({
                   movementCount,
                   totalIn,
                   totalOut,
                   latestBalance,
               }: Props) => [
    {
        title: "Displayed Movements",
        value: movementCount,
        icon: Activity,
    },
    {
        title: "Total Stock In",
        value: totalIn,
        icon: ArrowDownToLine,
    },
    {
        title: "Total Stock Out",
        value: totalOut,
        icon: ArrowUpFromLine,
    },
    {
        title: "Latest Recorded Balance",
        value: latestBalance ?? "—",
        icon: Boxes,
    },
];

export default function InventorySummary({
                                             movementCount,
                                             totalIn,
                                             totalOut,
                                             latestBalance,
                                         }: Props) {
    const summaryCards = cards({
        movementCount,
        totalIn,
        totalOut,
        latestBalance,
    });

    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
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

                            <Icon className="size-4 text-muted-foreground" />
                        </div>

                        <div className="mt-3 text-2xl font-semibold">
                            {typeof card.value === "number"
                                ? new Intl.NumberFormat(
                                    "en-DZ",
                                ).format(card.value)
                                : card.value}
                        </div>
                    </div>
                );
            })}
        </section>
    );
}