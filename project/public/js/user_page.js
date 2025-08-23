const socket = io();
const state = {
  users: [],
  currentUserId: null,
  paymentScriptLoaded: false
};

const MENU_ITEMS = [
  { id: "cardGame", name: "Juego: Cartas", section: "cardGame", active: true },
  { id: "game2", name: "Juego: Trivia", section: "game2", active: true },
  { id: "game3", name: "Juego: Memoria", section: "game3", active: false },
  { id: "payment", name: "Métodos de Pago", section: "payment", active: true },
  { id: "assistance", name: "Asistencia", section: "assistance", active: true }
];

document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  loadSidebarMenu(MENU_ITEMS);
  bindLogout();
  loadClickGames();
  setupAdminLogic();
  showDefaultSection();
});

async function loadUser() {
  const userEmail = localStorage.getItem("userEmail") || "admin@example.com";
  try {
    // Mock API response (replace with actual /api/admin/user call if available)
    const user = {
      id: "admin1",
      name: userEmail.split('@')[0],
      accessibleSections: ["cardGame", "game2", "game3", "payment", "assistance"]
    };
    state.users = [user];
    state.currentUserId = user.id;
    document.getElementById("userEmail").textContent = user.name;
  } catch (err) {
    console.error("Fallo en loadUser:", err.message);
    document.getElementById("error").textContent = "Error al cargar usuario.";
  }
}

function loadSidebarMenu(items) {
  const menuContainer = document.getElementById("menu-items");
  const user = getCurrentUser();
  if (!menuContainer || !user) {
    console.error("Menu container or user not found");
    return;
  }

  menuContainer.innerHTML = "";
  items.forEach(item => {
    if (item.active && user.accessibleSections.includes(item.section)) {
      const li = document.createElement("li");
      li.className = "p-4 hover:bg-blue-700 cursor-pointer";
      li.textContent = item.name;
      li.addEventListener("click", () => {
        if (item.section === 'payment') {
          loadPaymentSection();
        }
        showSection(item.section);
      });
      menuContainer.appendChild(li);
    }
  });

  const logoutLi = document.createElement("li");
  logoutLi.id = "logoutButton";
  logoutLi.className = "p-4 hover:bg-blue-700 cursor-pointer";
  logoutLi.textContent = "Cerrar Sesión";
  logoutLi.addEventListener("click", logout);
  menuContainer.appendChild(logoutLi);
}

async function loadPaymentSection() {
  const paymentsSection = document.getElementById('payments-section');
  if (!paymentsSection) {
    console.error("Payments section not found");
    document.getElementById('error').textContent = "Error: Sección de pagos no encontrada.";
    return;
  }

  try {
    const response = await fetch('/paymentMethod.html');
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    paymentsSection.innerHTML = await response.text();

    if (!state.paymentScriptLoaded) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/js/payment.js";
        script.id = "payment-script";
        script.defer = true;
        script.onload = () => {
          state.paymentScriptLoaded = true;
          resolve();
        };
        script.onerror = () => reject(new Error("Failed to load payment.js"));
        document.body.appendChild(script);
      });
    }
  } catch (err) {
    console.error("Error cargando sección de pagos:", err);
    document.getElementById('error').textContent = `Error cargando sección de pagos: ${err.message}`;
  }
}

function loadClickGames() {
  const buttons = [
    { id: "playTrivia", action: () => alert("¡Iniciando Trivia!") },
    { id: "playMemoria", action: () => alert("¡Iniciando Memoria!") },
    { id: "sendSupportMessage", action: () => {
      const supportMessage = document.getElementById("supportMessage");
      if (!supportMessage?.value) {
        alert("Por favor, escribe un mensaje.");
        return;
      }
      alert("¡Enviando mensaje de soporte!");
      supportMessage.value = "";
    }}
  ];

  buttons.forEach(({ id, action }) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener("click", action);
    }
  });
}

function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    section.classList.toggle('active', section.id === sectionId);
  });

  if (!document.getElementById(sectionId)) {
    console.error(`Sección no encontrada: ${sectionId}`);
    document.getElementById('error')?.textContent = `Sección ${sectionId} no encontrada.`;
    showDefaultSection();
  }
}

function showDefaultSection() {
  const user = getCurrentUser();
  const defaultSection = user?.accessibleSections[0] || "cardGame";
  if (document.getElementById(defaultSection)) {
    showSection(defaultSection);
  } else {
    console.error(`Sección por defecto (${defaultSection}) no encontrada.`);
    document.getElementById('error')?.textContent = "Error: No se pudo cargar la sección por defecto.";
  }
}

function setupAdminLogic() {
  const generarBtn = document.getElementById('generarBtn');
  if (generarBtn) {
    generarBtn.addEventListener('click', async () => {
      const nombre1 = document.getElementById('nombreUsuario1').value || 'Jugador 1';
      const nombre2 = document.getElementById('nombreUsuario2').value || 'Jugador 2';
      try {
        const response = await fetch(`/generar-enlaces?nombre1=${encodeURIComponent(nombre1)}&nombre2=${encodeURIComponent(nombre2)}`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        document.getElementById('enlaceGenerado1').value = data.enlace1;
        document.getElementById('enlaceGenerado2').value = data.enlace2;
      } catch (err) {
        document.getElementById('error').textContent = `Error al generar los enlaces: ${err.message}`;
      }
    });
  }

  socket.on('actualizarAdmin', ({ nombre, cartas, token }) => {
    const lista = document.getElementById('listaSelecciones');
    if (lista) {
      const li = document.createElement('li');
      li.textContent = `${nombre} (Token: ${token}): ${cartas.join(', ')}`;
      lista.appendChild(li);
    }
  });

  socket.on('connect_error', (err) => {
    document.getElementById('error').textContent = `Error de conexión con el servidor: ${err.message}`;
  });
}

function getCurrentUser() {
  return state.users.find(u => u.id === state.currentUserId) || { accessibleSections: ["cardGame", "game2", "game3", "payment", "assistance"] };
}

function logout() {
  ["accessToken", "creditCardPayments", "refreshToken", "token", "userEmail", "userLink"].forEach(k => localStorage.removeItem(k));
  window.location.href = "/index.html";
}