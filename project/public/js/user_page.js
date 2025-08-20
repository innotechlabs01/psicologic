// ======================= ESTADO GLOBAL =======================
const state = {
  users: [],
  currentUserId: null,
  paymentScriptLoaded: false // 👈 bandera para no cargar dos veces
};

// ======================= MENÚ ESTÁTICO =======================
const MENU_ITEMS = [
  { id: "game1", name: "Juego: Ahorcado", section: "game1", active: true },
  { id: "game2", name: "Juego: Trivia", section: "game2", active: true },
  { id: "game3", name: "Juego: Memoria", section: "game3", active: false },
  { id: "payment", name: "Métodos de Pago", section: "payment", active: true },
  { id: "assistance", name: "Asistencia", section: "assistance", active: true }
];

// ======================= INICIALIZACIÓN =======================
document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  loadSidebarMenu(MENU_ITEMS);
  bindLogout();
  showDefaultSection();
  loadClickGames();
});

// ======================= USUARIO =======================
async function loadUser() {
  const userEmail = localStorage.getItem("userEmail");
  if (!userEmail) {
    console.error("No se encontró el usuario en localStorage");
    return alert("Error al cargar el usuario. Intenta de nuevo.");
  }

  try {
    const res = await fetch(`/api/admin/user/${userEmail}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    });

    if (!res.ok) throw new Error(`Error API: ${res.status}`);

    const data = await res.json();
    if (data.user) {
      const user = {
        ...data.user,
        accessibleSections: ["game1", "game2", "payment", "assistance"]
      };
      state.users = [user];
      state.currentUserId = user.id;

      document.getElementById("userEmail").textContent = user.name;
    } else {
      console.error("Usuario no encontrado:", data.message);
      document.getElementById("userEmail").textContent = "Usuario Desconocido";
    }
  } catch (err) {
    console.error("Fallo en loadUser:", err.message);
    alert("Error al cargar usuario.");
  }
}

function loadClickGames() {
  const playAhorcado = document.getElementById("playAhorcado");
  if (playAhorcado) {
    playAhorcado.addEventListener("click", () => {
      alert("¡Iniciando Ahorcado!");
    });
  }
  const playTrivia = document.getElementById("playTrivia");
  if (playTrivia) {
    playTrivia.addEventListener("click", () => {
      alert("¡Iniciando Trivia!");
    });
  }
  const playMemoria = document.getElementById("playMemoria");
  if (playMemoria) {
    playMemoria.addEventListener("click", () => {
      alert("¡Iniciando Memoria!");
    });
  }

  const sendSupportMessage = document.getElementById("sendSupportMessage");
  const supportMessage = document.getElementById("supportMessage");
  if (sendSupportMessage) {
    sendSupportMessage.addEventListener("click", () => {
      if (!supportMessage.value) {
        return alert("Por favor, escribe un mensaje.");
      }
      alert("¡Enviando mensaje de soporte!");
      supportMessage.value = "";
    });
  }
}

// ======================= MENÚ =======================
function loadSidebarMenu(items) {
  const menuContainer = document.getElementById("menu-items");
  const user = getCurrentUser();

  if (!menuContainer || !user) return;

  menuContainer.innerHTML = "";

  items.forEach(item => {
    if (item.active && user.accessibleSections.includes(item.section)) {
      const li = document.createElement("li");
      li.className = "p-4 hover:bg-blue-700 cursor-pointer";
      li.textContent = item.name;
      
      // Sección de pagos: carga dinámica de HTML + JS
      li.onclick = () => {
        if (item.section === 'payment') {
          loadPaymentSection();
        }
        showSection(item.section);
      };
      
      menuContainer.appendChild(li);
    }
  });

  // Botón logout
  const logoutLi = document.createElement("li");
  logoutLi.id = "logoutButton";
  logoutLi.className = "p-4 hover:bg-blue-700 cursor-pointer";
  logoutLi.textContent = "Cerrar Sesión";
  logoutLi.onclick = logout;
  menuContainer.appendChild(logoutLi);
}

// ======================= PAGOS =======================
async function loadPaymentSection() {
  try {
    // Cargar el HTML en la sección
    const response = await fetch('/paymentMethod.html');
    document.getElementById('payments-section').innerHTML = await response.text();

    // Cargar el JS dinámicamente solo una vez
    if (!state.paymentScriptLoaded) {
      const script = document.createElement("script");
      script.src = "/js/payment.js";
      script.id = "payment-script";
      script.defer = true;
      document.body.appendChild(script);

      state.paymentScriptLoaded = true;
    }

  } catch (err) {
    console.error("❌ Error cargando sección de pagos:", err);
  }
}

function showDefaultSection() {
  const user = getCurrentUser();
  const defaultSection = user?.accessibleSections[0] || "game1";
  showSection(defaultSection);
}

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));

  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove("hidden");
  } else {
    console.error("Sección no encontrada:", sectionId);
    showDefaultSection();
  }
}

// ======================= SOPORTE =======================
function sendSupportMessage() {
  const msg = document.getElementById("supportMessage").value.trim();
  if (!msg) return alert("Escribe un mensaje.");
  alert("Mensaje enviado: " + msg);
  document.getElementById("supportMessage").value = "";
}

// ======================= LOGOUT =======================
function bindLogout() {
  const btn = document.getElementById("logoutButton");
  if (btn) btn.addEventListener("click", logout);
}

function logout() {
  [
    "accessToken",
    "creditCardPayments",
    "refreshToken",
    "token",
    "userEmail",
    "userLink"
  ].forEach(k => localStorage.removeItem(k));

  window.location.href = "/index.html";
}

// ======================= HELPERS =======================
function getCurrentUser() {
  return state.users.find(u => u.id === state.currentUserId) || null;
}
