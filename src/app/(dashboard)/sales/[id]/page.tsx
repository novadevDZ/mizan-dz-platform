import SaleDetails from "@/src/components/sales/sale-details";

export default async function SaleDetailsRoute({
                                                   params,
                                               }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;

    return (

        <SaleDetails id={id} />
    );
}