import type { Patient, PatientListResponse, PatientFormData } from '../types';

export class PatientService {
    static async getPatients(page: number, limit: number, query: string, includeInactive: boolean): Promise<PatientListResponse | null> {
        const inactive = includeInactive ? 1 : 0;
        const url = `/api/client/patients/list?page=${page}&limit=${limit}&q=${encodeURIComponent(query)}&include_inactive=${inactive}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to get patients:', err);
            return null;
        }
    }

    static async getPatientById(id: string): Promise<{ data: Patient } | null> {
        try {
            const res = await fetch(`/api/client/patients/${id}`);
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to get patient:', err);
            return null;
        }
    }

    static async createPatient(data: PatientFormData): Promise<any> {
        const config = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        };
        try {
            const res = await fetch("/api/client/patients/create", config);
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Create error:", err);
            return null;
        }
    }

    static async updatePatient(id: string, data: Partial<Patient>): Promise<any> {
        const config = {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        };
        try {
            const res = await fetch(`/api/client/patients/${id}`, config);
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Update error:", err);
            return null;
        }
    }

    static async changeStatus(id: string, status: 'active' | 'inactive'): Promise<any> {
        try {
            if (status === 'inactive') {
                const config = {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "inactive" }),
                };
                const res = await fetch(`/api/client/patients/${id}`, config);
                if (!res.ok) throw new Error(`Status: ${res.status}`);
                return await res.json();
            } else {
                const config = {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                };
                const res = await fetch("/api/client/patients/reactivate", config);
                if (!res.ok) throw new Error(`Status: ${res.status}`);
                return await res.json();
            }
        } catch (err) {
            console.error(`Change status error (${status}):`, err);
            return null;
        }
    }
}
