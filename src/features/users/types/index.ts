export type Patient = {
    id: string;
    name: string;
    document?: string;
    cedula?: string;
    email?: string;
    marital_status?: string;
    membership_paid?: boolean;
    status: 'active' | 'inactive';
};

export type PatientListResponse = {
    data: Patient[];
    totalPages: number;
    total: number;
};

export type PatientFormData = {
    name: string;
    cedula: string;
    email: string;
    marital_status: string;
};
