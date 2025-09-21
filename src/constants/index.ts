export const Contanst = {
    PERMISSION: [
        "admin",
        "client"
    ]
}

export interface MenuClient {
    id: number;
    slug: string;
    name: string;
    status: boolean;
}
