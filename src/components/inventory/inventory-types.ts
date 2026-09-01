export type InventoryMovementType =
    | "purchase"
    | "sale"
    | "return_in"
    | "return_out"
    | "adjustment_in"
    | "adjustment_out"
    | "stock_count"
    | string;

export type InventoryMovement = {
    id: string;
    productId: string;
    productName: string;
    sku: string | null;

    type: InventoryMovementType;

    referenceType: string | null;
    referenceId: string | null;
    referenceNumber: string | null;

    quantity: number;
    quantityChange: number;

    balanceBefore: number;
    balanceAfter: number;

    unitCost: number | null;

    reason: string | null;

    createdBy: string | null;
    createdAt: string;
};

export type InventoryPagination = {
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

export type InventoryMovementResponse = {
    items: InventoryMovement[];
    pagination: InventoryPagination;
};

export type InventoryProduct = {
    id: string;
    name: string;
    sku: string | null;
    stockQuantity: number;
    purchasePrice: number | null;
};

export type InventoryAdjustmentInput = {
    productId: string;
    direction: "in" | "out";
    quantity: number;
    reason: string;
};

export type InventoryStockCountInput = {
    productId: string;
    countedQuantity: number;
    reason: string;
};