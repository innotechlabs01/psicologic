export const Contanst = {
    PERMISSION: [
        "admin",
        "client"
    ]
}

export interface PropsPaymentStatus {
  refPayco: string | null;
  userId: string | null;
}


export interface MenuClient {
    id: number;
    slug: string;
    name: string;
    status: boolean;
}

export const ESTADOS = {
  1: 'Aprobado',
  2: 'Rechazado',
  3: 'Pendiente',
  4: 'Fallido',
}