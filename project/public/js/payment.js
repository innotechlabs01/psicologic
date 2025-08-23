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
      // Mock response (replace with actual /api/payments/:email)
      const data = {
        payments: [
          { id: 1, userId: "admin1", cardNumber: "**** **** **** 1234", cardHolder: "Admin User", amount: 150, date: "2025-08-23", status: "paid" }
        ]
      };
      state.payments = data.payments || [];
      renderTable();
    } catch (err) {
      console.error("Error cargando pagos:", err);
      showError("Error cargando pagos.");
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
      paymentsTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-3">No hay pagos registrados</td></tr>`;
      return;
    }

    state.payments.forEach((payment, index) => {
      const user = state.users.find(u => u.id === payment.userId) || { email: 'Unassigned' };
      const isOverdue = new Date(payment.date) < new Date();
      const dateClass = isOverdue ? 'text-red-500' : 'text-yellow-500';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="py-3 px-4 border-b">${payment.cardNumber}</td>
        <td class="py-3 px-4 border-b">${payment.cardHolder}</td>
        <td class="py-3 px-4 border-b">${user.email}</td>
        <td class="py-3 px-4 border-b">$${payment.amount}</td>
        <td class="py-3 px-4 border-b ${dateClass}">${payment.date}</td>
        <td class="py-3 px-4 border-b">
          <button data-index="${index}" class="edit-payment bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded">
            Editar
          </button>
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
  function initialize() {
    const payButton = document.getElementById("payButton");
    const closeModalBtn = document.getElementById('closeModalBtn');
    const creditCardForm = document.getElementById('creditCardForm');

    // Mock users (replace with actual API call)
    state.users = [{ id: "admin1", email: "admin@example.com" }];

    if (payButton) {
      payButton.addEventListener("click", () => processCheckout("admin1", 150));
    }
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", closeModal);
    }
    if (creditCardForm) {
      creditCardForm.addEventListener("submit", saveCreditCard);
    }

    loadUsersInSelect();
    loadUserPayments();
    checkNextPayment("admin1");
  }

  initialize();
});