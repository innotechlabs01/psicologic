class PaymentModule {
    constructor() {
        this.container = null;
        this.paymentsData = [];
    }

    async init() {
        try {
            this.container = document.getElementById('payments-section');
            if (!this.container) {
                throw new Error('Container de pagos no encontrado');
            }
            
            // Mostrar mensaje de carga
            this.showStatus('Cargando información de pagos...', 'info');
            
            await this.loadPaymentsTemplate();
            await this.loadPaymentsData();
            this.render();
            
            // Limpiar mensaje de estado
            this.clearStatus();
        } catch (error) {
            this.showStatus('No se pudo cargar la información de pagos. Por favor, intente más tarde.', 'error');
            throw error;
        }
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'payment-status';
        statusDiv.className = `p-4 rounded-lg mb-4 ${
            type === 'error' ? 'bg-red-100 text-red-700' :
            type === 'success' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
        }`;
        statusDiv.textContent = message;
        
        const existingStatus = this.container.querySelector('#payment-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        this.container.insertBefore(statusDiv, this.container.firstChild);
    }

    clearStatus() {
        const statusDiv = this.container.querySelector('#payment-status');
        if (statusDiv) {
            statusDiv.remove();
        }
    }

    async loadPaymentsTemplate() {
        const template = `
            <div class="container mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">Información de Pagos</h2>
                    
                    <!-- Resumen de Pagos -->
                    <div class="mb-8 p-4 bg-blue-50 rounded-lg" id="payment-summary">
                        <h3 class="text-xl font-semibold mb-4 text-blue-800">Resumen</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="payment-stats">
                        </div>
                    </div>

                    <!-- Lista de Pagos -->
                    <div class="mt-6">
                        <h3 class="text-xl font-semibold mb-4 text-gray-700">Historial de Pagos</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="py-3 px-4 text-left">Fecha</th>
                                        <th class="py-3 px-4 text-left">Concepto</th>
                                        <th class="py-3 px-4 text-left">Monto</th>
                                        <th class="py-3 px-4 text-left">Estado</th>
                                        <th class="py-3 px-4 text-left">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="payments-list">
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Botón de Nuevo Pago -->
                    <div class="mt-6">
                        <button id="new-payment-btn" 
                                class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Realizar Nuevo Pago
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.container.innerHTML = template;
    }

    async loadPaymentsData() {
        try {
            // Por ahora, usaremos datos de demostración
            // TODO: Implementar la llamada real a la API cuando esté disponible
            this.paymentsData = [
                {
                    id: '1',
                    date: new Date().toISOString(),
                    concept: 'Sesión de terapia',
                    amount: 75.00,
                    status: 'PAID'
                },
                {
                    id: '2',
                    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    concept: 'Próxima sesión',
                    amount: 75.00,
                    status: 'PENDING'
                },
                {
                    id: '3',
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    concept: 'Sesión cancelada',
                    amount: 75.00,
                    status: 'FAILED'
                }
            ];
        } catch (error) {
            console.error('Error cargando datos de pagos:', error);
            this.paymentsData = [];
        }
    }

    render() {
        this.renderPaymentStats();
        this.renderPaymentsList();
        this.setupEventListeners();
    }

    renderPaymentStats() {
        const statsContainer = document.getElementById('payment-stats');
        if (!statsContainer) return;

        const stats = this.calculatePaymentStats();
        
        statsContainer.innerHTML = `
            <div class="stat-card bg-white p-4 rounded-lg shadow">
                <h4 class="text-lg font-medium text-gray-600">Total Pagado</h4>
                <p class="text-2xl font-bold text-green-600">$${stats.totalPaid}</p>
            </div>
            <div class="stat-card bg-white p-4 rounded-lg shadow">
                <h4 class="text-lg font-medium text-gray-600">Pagos Pendientes</h4>
                <p class="text-2xl font-bold text-yellow-600">$${stats.pending}</p>
            </div>
            <div class="stat-card bg-white p-4 rounded-lg shadow">
                <h4 class="text-lg font-medium text-gray-600">Próximo Pago</h4>
                <p class="text-2xl font-bold text-blue-600">${stats.nextPayment}</p>
            </div>
        `;
    }

    renderPaymentsList() {
        const listContainer = document.getElementById('payments-list');
        if (!listContainer) return;

        listContainer.innerHTML = this.paymentsData
            .map(payment => `
                <tr class="border-b hover:bg-gray-50">
                    <td class="py-3 px-4">${this.formatDate(payment.date)}</td>
                    <td class="py-3 px-4">${payment.concept}</td>
                    <td class="py-3 px-4">$${payment.amount}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 rounded-full text-sm ${this.getStatusClass(payment.status)}">
                            ${payment.status}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <button class="text-blue-600 hover:text-blue-800 mr-2" 
                                onclick="paymentModule.viewPaymentDetails('${payment.id}')">
                            Ver detalles
                        </button>
                    </td>
                </tr>
            `)
            .join('');
    }

    setupEventListeners() {
        const newPaymentBtn = document.getElementById('new-payment-btn');
        if (newPaymentBtn) {
            newPaymentBtn.addEventListener('click', () => this.handleNewPayment());
        }
    }

    calculatePaymentStats() {
        // Aquí puedes implementar la lógica real para calcular las estadísticas
        return {
            totalPaid: this.paymentsData.reduce((sum, p) => sum + (p.status === 'PAID' ? p.amount : 0), 0).toFixed(2),
            pending: this.paymentsData.reduce((sum, p) => sum + (p.status === 'PENDING' ? p.amount : 0), 0).toFixed(2),
            nextPayment: this.getNextPaymentDate()
        };
    }

    getStatusClass(status) {
        const statusClasses = {
            'PAID': 'bg-green-100 text-green-800',
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'FAILED': 'bg-red-100 text-red-800'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getNextPaymentDate() {
        const pendingPayments = this.paymentsData
            .filter(p => p.status === 'PENDING')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return pendingPayments.length > 0 
            ? this.formatDate(pendingPayments[0].date)
            : 'No hay pagos pendientes';
    }

    async handleNewPayment() {
        // Implementar lógica para nuevo pago
        console.log('Nuevo pago iniciado');
        // Aquí puedes abrir un modal o redireccionar a la página de nuevo pago
    }

    async viewPaymentDetails(paymentId) {
        // Implementar vista de detalles
        console.log('Ver detalles del pago:', paymentId);
        // Aquí puedes abrir un modal con los detalles del pago
    }
}

// Exportar el módulo
window.paymentModule = new PaymentModule();
