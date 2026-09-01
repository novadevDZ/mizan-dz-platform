import SaleEditPage from "@/src/components/sales/sale-edit-page";

export default async function SaleEditRoute({
                                                params,
                                            }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;

    return (
        <SaleEditPage id={id} />
    );
}