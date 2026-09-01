import type {Metadata, Viewport} from "next";
import {Cairo} from "next/font/google";
import "./globals.css";

const cairo = Cairo({
    variable: "--font-cairo",
    subsets: ["arabic", "latin"],
    display: "swap",
    preload: true,
    fallback: ["Arial", "sans-serif"],
});

const SITE_URL = "https://mizandz.com";
const SITE_NAME = "Mizan DZ";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),

    /*
     * =========================================================
     * BASIC SEO
     * =========================================================
     */

    title: {
        default:
            "Mizan DZ | Business Management Software for Algerian Businesses",
        template: "%s | Mizan DZ",
    },

    description:
        "Mizan DZ is business management software built for Algerian businesses and wholesalers. Manage customers, products, sales, invoices, payments, outstanding balances, expenses, and inventory from one platform.",

    applicationName: SITE_NAME,

    generator: "Next.js",

    keywords: [
        "Mizan DZ",
        "Mizan",
        "business management software Algeria",
        "Algerian business software",
        "business management Algeria",
        "wholesale management software",
        "wholesale software Algeria",
        "inventory management Algeria",
        "sales management Algeria",
        "invoice software Algeria",
        "invoicing software Algeria",
        "customer management Algeria",
        "payment management Algeria",
        "debt management Algeria",
        "business accounting Algeria",
        "commercial management software",
        "Algerian wholesalers",
        "Algerian distributors",
        "SME software Algeria",
    ],

    authors: [
        {
            name: SITE_NAME,
            url: SITE_URL,
        },
    ],

    creator: SITE_NAME,
    publisher: SITE_NAME,

    category: "Business",

    /*
     * =========================================================
     * CANONICAL
     * =========================================================
     */

    alternates: {
        canonical: "/",
    },

    /*
     * =========================================================
     * ROBOTS
     * =========================================================
     */

    robots: {
        index: true,
        follow: true,

        googleBot: {
            index: true,
            follow: true,

            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
        },
    },

    /*
     * =========================================================
     * OPEN GRAPH
     * =========================================================
     */

    openGraph: {
        type: "website",

        locale: "en_DZ",

        url: SITE_URL,

        siteName: SITE_NAME,

        title:
            "Mizan DZ | Business Management Software for Algeria",

        description:
            "Run your Algerian business from one platform. Manage sales, customers, products, invoices, payments, inventory, expenses, and outstanding balances with Mizan DZ.",

        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                type: "image/png",
                alt:
                    "Mizan DZ - Business Management Software for Algerian Businesses",
            },
        ],
    },

    /*
     * =========================================================
     * TWITTER / X
     * =========================================================
     */

    twitter: {
        card: "summary_large_image",

        title:
            "Mizan DZ | Business Management Software for Algeria",

        description:
            "Manage sales, customers, products, invoices, payments, inventory, and business finances with Mizan DZ.",

        images: [
            {
                url: "/og-image.png",
                alt:
                    "Mizan DZ - Business Management Software",
            },
        ],
    },

    /*
     * =========================================================
     * ICONS
     * =========================================================
     */

    icons: {
        icon: [
            {
                url: "/icon.png",
                type: "image/png",
            },
        ],

        apple: [
            {
                url: "/apple-icon.png",
                type: "image/png",
            },
        ],
    },

    /*
     * =========================================================
     * WEB APP MANIFEST
     * =========================================================
     */

    manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
    themeColor: "#0F172A",
    colorScheme: "light",
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({
                                       children,
                                   }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            className={`${cairo.variable} antialiased`}
        >
        <head>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context":
                            "https://schema.org",

                        "@type":
                            "WebSite",

                        "@id": `${SITE_URL}/#website`,

                        name: SITE_NAME,

                        alternateName:
                            "Mizan",

                        url: SITE_URL,

                        description:
                            "Business management software built for Algerian businesses and wholesalers.",

                        inLanguage: "en-DZ",
                    }),
                }}
            />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context":
                            "https://schema.org",

                        "@type":
                            "Organization",

                        "@id": `${SITE_URL}/#organization`,

                        name: SITE_NAME,

                        url: SITE_URL,

                        logo: `${SITE_URL}/icon.png`,

                        description:
                            "Mizan DZ provides business management software for Algerian businesses and wholesalers.",

                        areaServed: {
                            "@type":
                                "Country",
                            name: "Algeria",
                        },

                        sameAs: [],
                    }),
                }}
            />
            <title></title>
        </head>

        <body className="min-h-screen bg-background font-sans">
        {children}
        </body>
        </html>
    );
}