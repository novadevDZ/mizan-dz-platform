import PaymentDetails from "@/src/components/payments/payment-details";

export default async function PaymentDetailsRoute({
                                                      params,
                                                  }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;

    return (
        <PaymentDetails id={id} />
    );
}