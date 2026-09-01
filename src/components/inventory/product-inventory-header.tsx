import Link from "next/link";
import {
    ArrowLeft,
    Package,
} from "lucide-react";

type Product = {
    id: string;
    name: string;
    sku: string | null;
    description: string | null;
};

type Props = {
    product: Product;
};

export default function ProductInventoryHeader({
                                                   product,
                                               }: Props) {
    return (
        <section>
            <Link
                href={`/products/${product.id}`}
                className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Back to Product
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Package className="size-7 text-primary" />
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {product.name}
                        </h1>

                        {product.sku && (
                            <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
                                {product.sku}
                            </span>
                        )}
                    </div>

                    {product.description && (
                        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                            {product.description}
                        </p>
                    )}

                    <p className="mt-2 text-sm text-muted-foreground">
                        Inventory Management
                    </p>
                </div>
            </div>
        </section>
    );
}