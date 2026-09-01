import PaymentEditPage from "@/src/components/payments/payment-edit-page";

export default async function PaymentEditRoute({
                                                   params,
                                               }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;

    return (
        <PaymentEditPage id={id} />
    );
}