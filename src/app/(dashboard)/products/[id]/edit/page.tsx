import ProductEditPage from "@/src/components/products/product-edit-page";

export default async function ProductEditRoute({
                                                   params,
                                               }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;

    return (
        <ProductEditPage id={id} />
    );
}