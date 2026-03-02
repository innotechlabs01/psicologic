import React, { useState, useEffect } from 'react';
import { Skeleton } from '../../../components/ui/skeleton';

interface Payment {
    username: string,
    email: string,
    id: string;
    paymentId: string;
    userId: string;
    amount: number;
    status: 'trial' | 'approved' | 'blocked';
    paymentDate: number;
}

export const PaymentDashboard: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const res = await fetch('/api/dashboard/payment');
                const data = await res.json();
                setPayments(data);
            } catch (err) {
                console.error("Error fetching payments:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    const totalRevenue = payments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0);

    const trialPayments = payments
        .filter(p => p.status === 'trial')
        .length;

    const approvedTransactions = payments
        .filter(p => p.status === 'approved')
        .length;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusClasses = (status: Payment['status']) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'trial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="dashboard-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Ingresos Totales</h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Basado en {approvedTransactions} aprobados.</p>
                </div>
                <div className="dashboard-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Cuentas en Prueba</h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{trialPayments}</p>
                    <p className="text-sm text-muted-foreground mt-1">Usuarios en periodo de prueba.</p>
                </div>
                <div className="dashboard-card">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Pensiones Totales</h3>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{payments.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">Total de registros.</p>
                </div>
            </div>

            <div className="dashboard-card">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Transacciones Recientes</h2>
                    <button className="dashboard-button-primary">Ver Todas</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 font-medium text-foreground">ID</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Usuario</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Monto</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Estado</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {payments.slice(0, 5).map((payment) => (
                                <tr key={payment.id}>
                                    <td className="py-3 px-4 text-foreground font-medium">{payment.paymentId}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{payment.username}</td>
                                    <td className="py-3 px-4 text-foreground">{formatCurrency(payment.amount)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(payment.status)}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-muted-foreground">{formatDate(payment.paymentDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
