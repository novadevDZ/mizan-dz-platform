import Link from "next/link";
import {
    ArrowDownToLine,
    ClipboardCheck,
    History,
} from "lucide-react";

export default function InventoryQuickActions() {
    return (
        <section className="grid gap-4 md:grid-cols-3">
            <Link
                href="/inventory/movements"
                className="group rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
                    <History className="size-5 text-primary" />
                </div>

                <h3 className="mt-4 font-semibold">
                    Movement History
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                    Review all inventory movements, adjustments, and stock changes.
                </p>
            </Link>

            <Link
                href="/inventory/adjustments"
                className="group rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
                <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-50">
                    <ArrowDownToLine className="size-5 text-emerald-600" />
                </div>

                <h3 className="mt-4 font-semibold">
                    Adjust Stock
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                    Increase or decrease stock and record the reason for the adjustment.
                </p>
            </Link>

            <Link
                href="/inventory/stock-count"
                className="group rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
                <div className="flex size-11 items-center justify-center rounded-lg bg-amber-50">
                    <ClipboardCheck className="size-5 text-amber-600" />
                </div>

                <h3 className="mt-4 font-semibold">
                    Stock Count
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                    Compare physical stock with the system balance and record discrepancies.
                </p>
            </Link>
        </section>
    );
}