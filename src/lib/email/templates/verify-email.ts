type VerifyEmailTemplateInput = {
    userName?: string | null;
    verificationUrl: string;
};

export function verifyEmailTemplate({
                                        userName,
                                        verificationUrl,
                                    }: VerifyEmailTemplateInput) {
    const displayName =
        userName?.trim() || "there";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />
    <title>Verify your Mizan DZ email</title>
</head>

<body
    style="
        margin:0;
        padding:0;
        background:#f6f8fb;
        font-family:Arial,Helvetica,sans-serif;
        color:#172033;
    "
>
    <div
        style="
            max-width:600px;
            margin:0 auto;
            padding:40px 20px;
        "
    >
        <div
            style="
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:20px;
                overflow:hidden;
            "
        >
            <div
                style="
                    padding:28px 32px;
                    border-bottom:1px solid #eef0f4;
                "
            >
                <div
                    style="
                        font-size:22px;
                        font-weight:800;
                        color:#2563eb;
                    "
                >
                    Mizan DZ
                </div>
            </div>

            <div style="padding:32px;">
                <p
                    style="
                        margin:0 0 12px;
                        font-size:14px;
                        color:#667085;
                    "
                >
                    Account verification
                </p>

                <h1
                    style="
                        margin:0;
                        font-size:28px;
                        line-height:1.3;
                    "
                >
                    Verify your email
                </h1>

                <p
                    style="
                        margin:18px 0 0;
                        font-size:16px;
                        line-height:1.7;
                        color:#475467;
                    "
                >
                    Hello ${escapeHtml(displayName)},
                </p>

                <p
                    style="
                        margin:12px 0 0;
                        font-size:16px;
                        line-height:1.7;
                        color:#475467;
                    "
                >
                    Please verify your email address to
                    continue using Mizan DZ and access
                    organization invitations.
                </p>

                <div style="margin:28px 0;">
                    <a
                        href="${escapeHtml(
        verificationUrl,
    )}"
                        style="
                            display:inline-block;
                            background:#2563eb;
                            color:#ffffff;
                            text-decoration:none;
                            padding:14px 22px;
                            border-radius:12px;
                            font-size:15px;
                            font-weight:700;
                        "
                    >
                        Verify email
                    </a>
                </div>

                <p
                    style="
                        margin:0;
                        font-size:13px;
                        line-height:1.7;
                        color:#98a2b3;
                    "
                >
                    This verification link expires according
                    to your Mizan DZ authentication settings.
                </p>

                <p
                    style="
                        margin:20px 0 0;
                        font-size:13px;
                        line-height:1.7;
                        color:#98a2b3;
                    "
                >
                    If you did not create this account,
                    you can safely ignore this email.
                </p>
            </div>
        </div>

        <p
            style="
                margin:18px 0 0;
                text-align:center;
                font-size:12px;
                color:#98a2b3;
            "
        >
            © ${new Date().getFullYear()} Mizan DZ
        </p>
    </div>
</body>
</html>
`;

    const text = `
Mizan DZ - Verify your email

Hello ${displayName},

Please verify your email address by opening this link:

${verificationUrl}

If you did not create this account, you can safely ignore this email.

© ${new Date().getFullYear()} Mizan DZ
`;

    return {
        html,
        text,
    };
}

function escapeHtml(
    value: string,
) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}