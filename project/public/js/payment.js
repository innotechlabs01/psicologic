// ==== Estado global ====
let users = [];
let payments = [];
let editIndex = null;

// ==== Utilidades ====
function getLoggedInUserId() {
  return localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
}

function maskCardNumber(number) {
  return `**** **** **** ${number.slice(-4)}`;
}

// ==== Validar próximo pago ====
async function checkNextPayment(userId) {
  try {
    const res = await fetch(`/api/user/${userId}/next-payment`);
    const data = await res.json();
    const payButton = document.getElementById("payButton");

    const today = new Date().toISOString().split("T")[0];
    payButton.disabled = !(!data.nextPaymentDate || data.nextPaymentDate <= today);
  } catch (err) {
    console.error("Error verificando próximo pago", err);
  }
}

// ==== Checkout con backend ====
async function processCheckout(userId, amount) {
  try {
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount })
    });
    const data = await res.json();
    if (data.init_point) window.location.href = data.init_point;
  } catch (err) {
    console.error("Error iniciando pago:", err);
  }
}

// ==== Cargar pagos del usuario ====
async function loadUserPayments() {
  const userEmail = getLoggedInUserId();
  if (!userEmail) return;

  console.log('paso por aqui')
  console.log(userEmail)
  try {
    const res = await fetch(`/api/payments/${userEmail}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ localStorage.getItem('token')}` },
    });
    const data = await res.json();
    console.log(data)
    payments = data.payments || [];
    renderTable();
  } catch (err) {
    console.error("Error cargando pagos:", err);
  }
}

// ==== Renderizar tabla ====
function renderTable() {
  const paymentsTableBody = document.getElementById('paymentsTableBody');
  paymentsTableBody.innerHTML = '';

  if (payments.length === 0) {
    paymentsTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-3">No hay pagos registrados</td></tr>`;
    return;
  }

  payments.forEach((payment, index) => {
    const getUser = JSON.parse(localStorage.getItem('user'));
    users = getUser;
    const user = users.find(u => u.id === payment.userId) || { email: 'Unassigned' };
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
        <button onclick="editPayment(${index})" 
          class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded">
          Editar
        </button>
      </td>
    `;
    paymentsTableBody.appendChild(row);
  });
}

// ==== Cargar usuarios en el select ====
function loadUsersInSelect() {
  const userSelect = document.getElementById('card-user');
  if (!userSelect) return;

  userSelect.innerHTML = '<option value="">Select a user</option>';
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = user.email;
    userSelect.appendChild(option);
  });
}

// ==== Modal ====
function openModal(isEdit = false, payment = null) {
  const modal = document.getElementById('creditCardModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('creditCardForm');

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
  document.getElementById('creditCardModal').classList.add('hidden');
}

// ==== Guardar tarjeta ====
function saveCreditCard(e) {
  e.preventDefault();

  const userId = parseInt(document.getElementById('card-user').value, 10);
  const cardNumber = document.getElementById('cardNumber').value;
  const cardHolder = document.getElementById('cardHolder').value;
  const expiryDate = document.getElementById('expiryDate').value;
  const cvv = document.getElementById('cvv').value;

  if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
    alert('Please fill in all fields.');
    return;
  }

  const paymentData = {
    id: editIndex !== null ? payments[editIndex].id : payments.length + 1,
    userId,
    cardNumber: maskCardNumber(cardNumber),
    cardHolder,
    amount: (Math.random() * 200).toFixed(2),
    date: new Date().toISOString().split('T')[0],
    status: 'paid'
  };

  if (editIndex !== null) {
    payments[editIndex] = paymentData;
    editIndex = null;
  } else {
    payments.push(paymentData);
  }

  renderTable();
  closeModal();
}

// ==== Editar pago ====
window.editPayment = function(index) {
  editIndex = index;
  openModal(true, payments[index]);
};

// ==== Eventos ====
document.addEventListener('DOMContentLoaded', () => {
  const payButton = document.getElementById("payButton");
  const closeModalBtn = document.getElementById('closeModalBtn');
  const creditCardForm = document.getElementById('creditCardForm');

  loadUsersInSelect();
  loadUserPayments();

  payButton.addEventListener("click", () => processCheckout(1, 150));
  closeModalBtn.addEventListener("click", closeModal);
  creditCardForm.addEventListener("submit", saveCreditCard);

  checkNextPayment(1);
});
