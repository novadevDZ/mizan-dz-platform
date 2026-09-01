import Link from "next/link";
import {
    ArrowLeft,
    ClipboardCheck,
} from "lucide-react";

import InventoryStockCountForm from "@/src/components/inventory/inventory-stock-count-form";

export default function InventoryStockCountPage() {
    return (
        <main
            dir="ltr"
            className="space-y-6 p-6"
        >
            <section>
                <Link
                    href="/inventory"
                    className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Inventory Tracker
                </Link>

                <div className="flex items-center gap-3">


                    <div>
                        <h1 className="text-2xl font-semibold">
                            Stock Count
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Compare physical stock with the system balance and record any difference.
                        </p>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border bg-card shadow-sm">
                <div className="border-b p-5">
                    <h2 className="font-semibold">
                        Record Stock Count
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        If the physical quantity differs from the system quantity,
                        the difference will be recorded as a stock_count movement.
                    </p>
                </div>

                <div className="p-5">
                    <InventoryStockCountForm />
                </div>
            </section>
        </main>
    );
}