import ProductInventoryPage from "@/src/components/inventory/product-inventory-page";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function ProductInventoryRoute({
                                                        params,
                                                    }: PageProps) {
    const { id } = await params;

    return <ProductInventoryPage productId={id} />;
}