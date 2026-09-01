"use client";

import {Search, X} from "lucide-react";

type Props = {
    search: string;
    onSearchChange: (value: string) => void;
    onReset: () => void;
};

export default function InventoryMovementFilters({
                                                     search,
                                                     onSearchChange,
                                                     onReset,
                                                 }: Props) {
    return (
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
                <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                />

                <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                        onSearchChange(event.target.value)
                    }
                    placeholder="Search by product, SKU, reference, or reason..."
                    aria-label="Search inventory movements"
                    className="h-10 w-full rounded-lg border bg-background px-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                {search && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Clear search"
                        title="Clear search"
                    >
                        <X className="size-4"/>
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={onReset}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
                Reset
            </button>
        </div>
    );
}