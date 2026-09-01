import Link from "next/link";
import {
    ArrowDownToLine,
    ArrowLeft,
} from "lucide-react";

import InventoryAdjustmentForm from "@/src/components/inventory/inventory-adjustment-form";

export default function InventoryAdjustmentsPage() {
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
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                        <ArrowDownToLine className="size-6 text-primary" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-semibold">
                            Stock Adjustment
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Record a manual stock increase or decrease with a clear reason.
                        </p>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border bg-card shadow-sm">
                <div className="border-b p-5">
                    <h2 className="font-semibold">
                        Record Manual Movement
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        The product balance will be updated and a movement record
                        will be created within the same transaction.
                    </p>
                </div>

                <div className="p-5">
                    <InventoryAdjustmentForm />
                </div>
            </section>
        </main>
    );
}