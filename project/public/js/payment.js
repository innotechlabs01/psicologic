// Payment state management
let paymentState = {
    lastPayment: null,
    expirationDate: null,
    status: 'inactive',
    daysRemaining: 0
};

// Status colors and text mappings
const STATUS_STYLES = {
    pending: { color: 'text-yellow-600 bg-yellow-100', text: 'Pendiente' },
    approved: { color: 'text-green-600 bg-green-100', text: 'Aprobado' },
    rejected: { color: 'text-red-600 bg-red-100', text: 'Rechazado' }
};

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    users: [],
    payments: [],
    editIndex: null
  };

  // Utilidades
  function getLoggedInUserId() {
    return localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || 'admin@example.com';
  }

  function maskCardNumber(number) {
    return `**** **** **** ${number.slice(-4)}`;
  }

  // Validar próximo pago (mock)
  async function checkNextPayment(userId) {
    try {
      // Mock response (replace with actual API call)
      const data = { nextPaymentDate: null }; // Simulate no pending payment
      const payButton = document.getElementById("payButton");
      if (!payButton) return;
      const today = new Date().toISOString().split("T")[0];
      payButton.disabled = !(!data.nextPaymentDate || data.nextPaymentDate <= today);
    } catch (err) {
      console.error("Error verificando próximo pago:", err);
    }
  }

  // Checkout con backend (mock)
  async function processCheckout(userId, amount) {
    try {
      // Mock response (replace with actual /api/payments/checkout)
      const data = { init_point: "https://example.com/checkout" };
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err) {
      console.error("Error iniciando pago:", err);
    }
  }

  // Cargar pagos del usuario
  async function loadUserPayments() {
    const userEmail = getLoggedInUserId();
    if (!userEmail) return;

    try {
      const response = await fetch(`/api/payments/${userEmail}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener los pagos');
      }

      const payments = await response.json();
      state.payments = payments;
      renderTable();
      updateSubscriptionStatus(payments);
    } catch (err) {
      console.error("Error cargando pagos:", err);
      showError("Error cargando pagos: " + err.message);
    }
  }

  // Renderizar tabla
  function renderTable() {
    const paymentsTableBody = document.getElementById('paymentsTableBody');
    if (!paymentsTableBody) {
      console.error("Payments table body not found");
      return;
    }

    paymentsTableBody.innerHTML = '';
    if (state.payments.length === 0) {
      paymentsTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No hay pagos registrados</td></tr>`;
      return;
    }

    state.payments.forEach(payment => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${payment.paymentId}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${new Date(payment.paymentDate).toLocaleDateString()}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          $${payment.amount.toFixed(2)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_STYLES[payment.status].color}">
            ${STATUS_STYLES[payment.status].text}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${payment.nextPaymentDate ? new Date(payment.nextPaymentDate).toLocaleDateString() : 'N/A'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${payment.blockedPaymentDate ? new Date(payment.blockedPaymentDate).toLocaleDateString() : 'N/A'}
        </td>
      `;
      paymentsTableBody.appendChild(row);
    });

    // Add event listeners for edit buttons
    document.querySelectorAll('.edit-payment').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'), 10);
        editPayment(index);
      });
    });
  }

  // Cargar usuarios en el select
  function loadUsersInSelect() {
    const userSelect = document.getElementById('card-user');
    if (!userSelect) return;

    userSelect.innerHTML = '<option value="">Select a user</option>';
    state.users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.email;
      userSelect.appendChild(option);
    });
  }

  // Modal
  function openModal(isEdit = false, payment = null) {
    const modal = document.getElementById('creditCardModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('creditCardForm');
    if (!modal || !modalTitle || !form) return;

    loadUsersInSelect();
    form.reset();

    if (isEdit && payment) {
      modalTitle.textContent = 'Edit Credit Card';
      document.getElementById('card-user').value = payment.userId || '';
      document.getElementById('cardNumber').value = payment.cardNumber.replace(/\*/g, '');
      document.getElementById('cardHolder').value = payment.cardHolder;
      document.getElementById('expiryDate').value = payment.expiryDate || '12/25';
      document.getElementById('cvv').value = payment.cvv || '123';
    } else {
      modalTitle.textContent = 'Add Credit Card';
    }

    modal.classList.remove('hidden');
  }

  function closeModal() {
    const modal = document.getElementById('creditCardModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Guardar tarjeta
  function saveCreditCard(e) {
    e.preventDefault();

    const userId = parseInt(document.getElementById('card-user').value, 10);
    const cardNumber = document.getElementById('cardNumber').value;
    const cardHolder = document.getElementById('cardHolder').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;

    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const paymentData = {
      id: state.editIndex !== null ? state.payments[state.editIndex].id : state.payments.length + 1,
      userId,
      cardNumber: maskCardNumber(cardNumber),
      cardHolder,
      amount: (Math.random() * 200).toFixed(2),
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
      expiryDate,
      cvv
    };

    if (state.editIndex !== null) {
      state.payments[state.editIndex] = paymentData;
      state.editIndex = null;
    } else {
      state.payments.push(paymentData);
    }

    renderTable();
    closeModal();
  }

  // Editar pago
  function editPayment(index) {
    state.editIndex = index;
    openModal(true, state.payments[index]);
  }

  // Mostrar error
  function showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
      errorDiv.textContent = message;
    } else {
      console.error(message);
    }
  }

  // Inicialización
  function updateSubscriptionStatus(payments) {
    const latestPayment = payments[0];
    if (!latestPayment) {
      setStatusText('Sin pagos registrados');
      setLastPaymentDate('N/A');
      setNextPaymentDate('N/A');
      setDaysRemaining('N/A');
      showPaymentButton(true);
      return;
    }

    const now = new Date();
    const blockDate = new Date(latestPayment.blockedPaymentDate);
    const daysRemaining = Math.ceil((blockDate - now) / (1000 * 60 * 60 * 24));

    let status = 'Activa';
    let showButton = false;

    if (latestPayment.status !== 'approved') {
      status = 'Pago pendiente';
      showButton = true;
    } else if (daysRemaining <= 5) {
      status = 'Próxima a vencer';
      showButton = true;
    } else if (daysRemaining <= 0) {
      status = 'Vencida';
      showButton = true;
    }

    setStatusText(status);
    setLastPaymentDate(new Date(latestPayment.paymentDate).toLocaleDateString());
    setNextPaymentDate(new Date(latestPayment.nextPaymentDate).toLocaleDateString());
    setDaysRemaining(Math.max(0, daysRemaining));
    showPaymentButton(showButton);
  }

  function setStatusText(text) {
    const element = document.getElementById('subscriptionStatus');
    if (element) element.textContent = text;
  }

  function setLastPaymentDate(date) {
    const element = document.getElementById('lastPaymentDate');
    if (element) element.textContent = date;
  }

  function setNextPaymentDate(date) {
    const element = document.getElementById('nextPaymentDate');
    if (element) element.textContent = date;
  }

  function setDaysRemaining(days) {
    const element = document.getElementById('daysRemaining');
    if (element) element.textContent = typeof days === 'number' ? `${days} días` : days;
  }

  function showPaymentButton(show) {
    const container = document.getElementById('paymentButtonContainer');
    if (!container) return;

    if (show) {
      container.innerHTML = `
        <button onclick="handlePayment()" 
                class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
          Realizar Pago
        </button>
      `;
    } else {
      container.innerHTML = '';
    }
  }

  async function handlePayment() {
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: JSON.parse(localStorage.getItem('user')).id,
          amount: 999 // $9.99 en centavos
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear el pago');
      }

      const { init_point } = await response.json();
      window.location.href = init_point;
    } catch (error) {
      console.error('Error:', error);
      showError(error.message);
    }
  }

  function initialize() {
    loadUserPayments();
  }

  initialize();
});