"use client";

import {
    Search,
    X,
} from "lucide-react";

type Props = {
    search: string;
    onSearchChange: (
        value: string,
    ) => void;
    onReset: () => void;
};

export default function ProductInventoryMovementFilters({
                                                            search,
                                                            onSearchChange,
                                                            onReset,
                                                        }: Props) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-lg">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                    value={search}
                    onChange={(event) =>
                        onSearchChange(
                            event.target.value,
                        )
                    }
                    placeholder="Search by reference or reason..."
                    className="h-10 w-full rounded-lg border bg-background pl-10 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                />

                {search && (
                    <button
                        type="button"
                        onClick={() =>
                            onSearchChange("")
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={onReset}
                className="h-10 rounded-lg border px-4 text-sm font-medium transition hover:bg-muted"
            >
                Reset
            </button>
        </div>
    );
}