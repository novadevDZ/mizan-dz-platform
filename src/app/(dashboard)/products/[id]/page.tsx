import ProductDetails from "@/src/components/products/product-details";

export default async function ProductDetailsRoute({
                                                      params,
                                                  }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;

    return (
        <ProductDetails id={id} />
    );
}