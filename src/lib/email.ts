import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    throw new Error(
        "RESEND_API_KEY is not configured.",
    );
}

const resend = new Resend(apiKey);

const from =
    process.env.RESEND_FROM ||
    "Mizan DZ <onboarding@resend.dev>";

type SendEmailInput = {
    to: string;
    subject: string;
    html: string;
    text?: string;
};

export async function sendEmail({
                                    to,
                                    subject,
                                    html,
                                    text,
                                }: SendEmailInput) {
    const { data, error } =
        await resend.emails.send({
            from,
            to: [to],
            subject,
            html,
            text,
        });

    if (error) {
        console.error(
            "[Email] Resend error:",
            error,
        );

        throw new Error(
            error.message ||
            "Failed to send email.",
        );
    }

    return data;
}