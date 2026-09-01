import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import LowStockPage from "@/src/components/inventory/low-stock-page";

export default function LowStockRoute() {
    return (
        <div className="space-y-6">
            <Link
                href="/inventory"
                className="inline-flex items-center gap-2 px-6 pt-6 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to Inventory
            </Link>

            <LowStockPage />
        </div>
    );
}