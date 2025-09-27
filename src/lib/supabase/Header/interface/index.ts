export interface UserGameHeader {
    userId: string,
    menu: UserGameHeaderResponse[] | null,
    status: boolean
}

export interface UserGameHeaderResponse {
    id: string;
    name: string;
    slug: string;
    status: string;
    subItem?: UserGameHeaderResponse[] | null;
}

export interface GetUserGameHeaderParams {
    id: string;
    name: string;
    slug: string;
    status: string;
}