import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    ePayco: any;
  }
}

interface PaymentInfo {
  paymentId?: string;
  userId: string;
  paymentDate: string | null;
  nextPaymentDate: string | null;
  daysToNext: number;
  subscriptionStatus: string;
  isActive: boolean;
}

interface PaymentRecord {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  paymentDate: string;
  nextPaymentDate: string;
}

interface UserPaymentProps {
  paymentData: {
    paymentInfo: PaymentInfo;
    paymentHistory: PaymentRecord[];
  };
  userId: string;
  paymentAmount: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isActive 
      ? 'bg-green-100 text-green-700' 
      : 'bg-gray-100 text-gray-600'}`}>
      {isActive ? 'Activa' : 'Inactiva'}
    </span>
  );
}

export default function UserPaymentDashboard({ paymentData, userId, paymentAmount }: UserPaymentProps) {
  const [loading, setLoading] = useState(false);

  const paymentInfo = paymentData?.paymentInfo || {};
  const paymentHistory = paymentData?.paymentHistory || [];
  const isActive = paymentInfo?.isActive || false;
  const daysToNext = paymentInfo?.daysToNext || 0;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.epayco.co/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.epayco.co/checkout.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/epayCO/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Suscripción Psicologic',
          description: 'Suscripción mensual a la plataforma',
          invoice: `INV-${Date.now()}`,
          currency: 'cop',
          amount: paymentAmount,
          tax_base: '0',
          tax: '0',
          country: 'co',
          lang: 'es',
          email_billing: '',
          userId
        }),
      });

      const { checkoutData, publicKey, isTest } = await response.json();

      if (window.ePayco) {
        const handler = window.ePayco.checkout.configure({
          key: publicKey,
          test: isTest,
        });
        handler.open(checkoutData);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('No se pudo iniciar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">Información de suscripción</p>
          <ul className="mt-1 space-y-1 text-blue-600 dark:text-blue-400">
            <li>• Los pagos se procesan de forma segura a través de EpayCO</li>
            <li>• Tu suscripción se renueva cada 30 días</li>
          </ul>
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Estado de Suscripción</h3>
          <StatusBadge isActive={isActive} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Fecha de inicio</p>
            <p className="font-medium">{formatDate(paymentInfo.paymentDate)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Próxima fecha de pago</p>
            <p className="font-medium">{formatDate(paymentInfo.nextPaymentDate)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Días restantes</p>
            <p className="font-medium">{daysToNext} días</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          {!isActive || daysToNext <= 7 ? (
            <>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Cargando...' : `Pagar ${formatCurrency(parseInt(paymentAmount))}`}
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                Pago seguro mediante epayCO
              </p>
            </>
          ) : (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              ✅ Tu suscripción está activa. Te quedan <strong>{daysToNext}</strong> días para renovar.
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Historial de Pagos</h3>
        
        {paymentHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No hay pagos registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Monto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment: PaymentRecord) => (
                  <tr key={payment.id} className="border-b border-border/50">
                    <td className="py-3 px-4">{formatDate(payment.paymentDate)}</td>
                    <td className="py-3 px-4">{formatCurrency(payment.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.status === 'approved' ? 'bg-green-100 text-green-700' :
                        payment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {payment.status === 'approved' ? 'Aprobado' :
                         payment.status === 'rejected' ? 'Rechazado' :
                         payment.status === 'pending' ? 'Pendiente' :
                         payment.status === 'failed' ? 'Fallido' : payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{payment.paymentId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
