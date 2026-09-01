export type DashboardMoney = {
    today: number;
    currentMonth: number;
};

export type DashboardKpis = {
    todaySales: number;
    todayCollected: number;
    outstandingDebts: number;
    todayExpenses: number;

    monthSales: number;
    monthCollected: number;
    monthExpenses: number;
    monthNet: number;
};

export type DashboardCounts = {
    customers: number;
    products: number;
    invoices: number;
    sales: number;
};

export type DashboardProfile = {
    percentage: number;
    completed: number;
    total: number;
};

export type DashboardSalesTrendItem = {
    date: string;
    label: string;
    sales: number;
    payments: number;
};

export type DashboardRecentSale = {
    id: string;
    customerName: string;
    total: number;
    paid: number;
    outstanding: number;
    createdAt: string;
};

export type DashboardTopDebtor = {
    customerId: string;
    customerName: string;
    phone: string | null;
    outstanding: number;
};

export type DashboardAlert = {
    id: string;
    type:
        | "overdue"
        | "debt"
        | "stock"
        | "invoice"
        | "info";
    title: string;
    description: string;
    href: string;
    priority: "high" | "medium" | "low";
};

export type DashboardRoleChartItem = {
    role: string;
    count: number;
};

export type DashboardData = {
    greeting: string;

    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };

    organization: {
        id: string;
        name: string;
        wilaya: string;
        currency: string;
        createdAt: string;
    };

    organizationAge: string;

    memberCount: number;

    profile: DashboardProfile;

    roleChart: DashboardRoleChartItem[];

    kpis: DashboardKpis;

    counts: DashboardCounts;

    salesTrend: DashboardSalesTrendItem[];

    recentSales: DashboardRecentSale[];

    topDebtors: DashboardTopDebtor[];

    alerts: DashboardAlert[];
};