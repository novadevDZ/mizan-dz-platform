import PaymentForm from "@/src/components/payments/payments-form";
export default async function NewPaymentRoute({
                                                  searchParams,
                                              }: {
    searchParams: Promise<{
        saleId?: string;
    }>;
}) {
    const params = await searchParams;

    return (
        <PaymentForm
            saleId={params.saleId}
        />
    );
}