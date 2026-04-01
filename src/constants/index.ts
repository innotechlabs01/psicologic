export const Contanst = {
    PERMISSION: [
        "admin",
        "client"
    ]
}

export interface PropsPaymentStatus {
  orderId: string | null;
  userId: string | null;
}


export interface MenuClient {
    id: number;
    slug: string;
    name: string;
    status: boolean;
}

export const ESTADOS: Record<string, string> = {
  'APPROVED': 'Aprobado',
  'REJECTED': 'Rechazado',
  'PENDING': 'Pendiente',
  'PROCESSING': 'Pendiente',
  'FAILED': 'Fallido',
  'VOIDED': 'Anulado',
}