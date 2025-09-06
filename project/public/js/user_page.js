
    const socket = io();
    const state = {
      users: [],
      currentUserId: null,
      paymentScriptLoaded: false
    };
    const totalCards = 12;
    const selecciones = [];
    let cards = [];
    let valuesUsed = [];
    let currentMove = 0;
    let currentAttempts = 0;
    const QUESTIONS = [
      "¿Cómo te imaginas nuestro futuro juntos?",
      "¿Hay alguna tradición o hábito que te gustaría que empecemos como pareja?",
      "¿Cómo podemos hacer que nuestra relación sea aún más fuerte?",
      "¿Cómo te gustaría que celebremos nuestro próximo aniversario?",
      "¿Hay algo que te gustaría que hiciéramos más a menudo?",
      "¿Hay algo que sientas que no hemos discutido lo suficiente?",
      "¿Cómo puedo animarte cuando te sientas triste?",
      "¿Hay algo que siempre has querido saber sobre mí pero nunca preguntado?",
      "¿Cómo describirías nuestra relación en tres palabras?",
      "¿Qué hace que sientas más conmigo?",
      "¿Qué es lo que más te gusta hacer cuando estamos juntos?",
      "¿Qué es lo que te atrajo de mí cuando nos conocimos?"
    ];
    const QuestionKiss = [
      "¿Cómo te imaginas nuestro futuro juntos?",
      "¿Hay alguna tradición o hábito que te gustaría que empecemos como pareja?",
      "¿Cómo podemos hacer que nuestra relación sea aún más fuerte?",
      "¿Cómo te gustaría que celebremos nuestro próximo aniversario?",
      "¿Hay algo que te gustaría que hiciéramos más a menudo?",
      "¿Hay algo que sientas que no hemos discutido lo suficiente?",
      "¿Cómo puedo animarte cuando te sientas triste?",
      "¿Hay algo que siempre has querido saber sobre mí pero nunca preguntado?",
      "¿Cómo describirías nuestra relación en tres palabras?",
      "¿Qué hace que sientas más conmigo?",
      "¿Qué es lo que más te gusta hacer cuando estamos juntos?",
      "¿Qué es lo que te atrajo de mí cuando nos conocimos?"
    ];
    const QuestionFire = [
      "¿Cómo te imaginas nuestro futuro juntos?",
      "¿Hay alguna tradición o hábito que te gustaría que empecemos como pareja?",
      "¿Cómo podemos hacer que nuestra relación sea aún más fuerte?",
      "¿Cómo te gustaría que celebremos nuestro próximo aniversario?",
      "¿Hay algo que te gustaría que hiciéramos más a menudo?",
      "¿Hay algo que sientas que no hemos discutido lo suficiente?",
      "¿Cómo puedo animarte cuando te sientas triste?",
      "¿Hay algo que siempre has querido saber sobre mí pero nunca preguntado?",
      "¿Cómo describirías nuestra relación en tres palabras?",
      "¿Qué hace que sientas más conmigo?",
      "¿Qué es lo que más te gusta hacer cuando estamos juntos?",
      "¿Qué es lo que te atrajo de mí cuando nos conocimos?"
    ];
    const QuestionTruth = [
      "¿Cómo te imaginas nuestro futuro juntos?",
      "¿Hay alguna tradición o hábito que te gustaría que empecemos como pareja?",
      "¿Cómo podemos hacer que nuestra relación sea aún más fuerte?",
      "¿Cómo te gustaría que celebremos nuestro próximo aniversario?",
      "¿Hay algo que te gustaría que hiciéramos más a menudo?",
      "¿Hay algo que sientas que no hemos discutido lo suficiente?",
      "¿Cómo puedo animarte cuando te sientas triste?",
      "¿Hay algo que siempre has querido saber sobre mí pero nunca preguntado?",
      "¿Cómo describirías nuestra relación en tres palabras?",
      "¿Qué hace que sientas más conmigo?",
      "¿Qué es lo que más te gusta hacer cuando estamos juntos?",
      "¿Qué es lo que te atrajo de mí cuando nos conocimos?"
    ];
    function createCardElement(cartaId, gameType, pregunta, cardNumber) {
      const card = document.createElement('div');
      card.classList.add('card', 'w-24', 'h-36', 'rounded-lg', 'shadow-lg', 'cursor-pointer', 'transition-all', 'duration-300', 'ease-in-out', 'transform', 'hover:scale-105', 'flex', 'items-center', 'justify-center', 'bg-cover', 'bg-center', 'mb-4', 'other-selected');
      card.dataset.cartaId = cartaId;
      card.innerHTML = `
        <div class="back">${cardNumber}</div>
        <div class="face flex flex-col items-center justify-center bg-white p-4">
          <span class="text-sm text-gray-800 text-center">${pregunta || QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]}</span>
        </div>
      `;
      return card;
    }
    const MENU_ITEMS = [
      { id: "cardGame", name: "Juego: Cartas", section: "cardGame", active: true },
      { id: "game2", name: "Juego: Trivia", section: "game2", active: true },
      { id: "game3", name: "Juego: Memoria", section: "game3", active: false },
      { id: "payment", name: "Métodos de Pago", section: "payment", active: true },
      { id: "assistance", name: "Asistencia", section: "assistance", active: true }
    ];
    document.addEventListener("DOMContentLoaded", async () => {
      error.textContent = "";
      await loadUser();
      loadSidebarMenu(MENU_ITEMS);
      loadClickGames();
      setupAdminLogic();
      showDefaultSection();
      setupSidebar();
      setupSocketListeners();
      setupClickRadioButton();
    });
    function setupSidebar() {
      const menuItems = document.querySelectorAll('#menu-items a');
      menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const sectionId = item.dataset.section;
          if (sectionId) {
            showSection(sectionId);
            menuItems.forEach(menuItem => {
              if (menuItem.dataset.section === sectionId) {
                menuItem.classList.add('bg-blue-700');
              } else {
                menuItem.classList.remove('bg-blue-700');
              }
            });
          }
        });
      });
      const defaultSection = document.querySelector('.section.active');
      if (defaultSection) {
        const defaultMenuItem = document.querySelector(`#menu-items a[data-section="${defaultSection.id}"]`);
        if (defaultMenuItem) {
          defaultMenuItem.classList.add('bg-blue-700');
        }
      }
    }
    async function loadUser() {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        const userEmail = localStorage.getItem("userEmail");
        let userData = null;
        if (storedUser && storedUser !== "Not found") {
          try {
            userData = JSON.parse(storedUser);
          } catch (e) {
            console.warn("Error parsing stored user:", e);
          }
        }
        if (!userData && token) {
          try {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              userData = await response.json();
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (e) {
            console.warn("Error fetching user data from server:", e);
          }
        }
        if (!userData && userEmail) {
          userData = {
            id: userEmail,
            email: userEmail,
            name: userEmail.split('@')[0]
          };
        }
        if (userData) {
          userData = {
            ...userData,
            accessibleSections: ["cardGame", "game2", "game3", "payment", "assistance"]
          };
          state.users = [userData];
          state.currentUserId = userData.id;
          const userEmailElement = document.getElementById("userEmail");
          if (userEmailElement) {
            userEmailElement.textContent = userData.name || userData.email || "Usuario";
          }
          return userData;
        } else {
          console.error("No se encontró información del usuario");
          window.location.href = "/index.html";
          return null;
        }
      } catch (err) {
        console.error("Error en loadUser:", err);
        showError("Error al cargar los datos del usuario");
        setTimeout(() => {
          window.location.href = "/index.html";
        }, 2000);
        return null;
      }
    }
    async function loadSidebarMenu(items) {
      try {
        const navbarContainer = document.getElementById("navbar-container");
        if (navbarContainer) {
          const navbarResponse = await fetch('/navbar.html');
          if (!navbarResponse.ok) throw new Error('Error cargando el navbar');
          navbarContainer.innerHTML = await navbarResponse.text();
        }
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
            const a = document.createElement("a");
            a.href = "#";
            a.className = "block p-4 hover:bg-blue-700 transition-colors duration-200";
            a.dataset.section = item.section;
            a.textContent = item.name;
            a.addEventListener("click", async (e) => {
              e.preventDefault();
              const existingSection = document.getElementById(item.section);
              if (!existingSection) {
                const mainContent = document.querySelector('#userContent');
                if (mainContent) {
                  const newSection = document.createElement('div');
                  newSection.id = item.section;
                  newSection.className = 'section hidden';
                  if (item.section === 'payment') {
                    const paymentsSection = document.createElement('div');
                    paymentsSection.id = 'payments-section';
                    paymentsSection.className = 'w-full h-full p-4';
                    newSection.appendChild(paymentsSection);
                  }
                  mainContent.appendChild(newSection);
                }
              }
              showSection(item.section);
              if (item.section === 'payment') {
                await loadPaymentSection();
              }
            });
            li.appendChild(a);
            menuContainer.appendChild(li);
          }
        });
        const logoutLi = document.createElement("li");
        const logoutA = document.createElement("a");
        logoutA.href = "#";
        logoutA.id = "logoutButton";
        logoutA.className = "block p-4 hover:bg-blue-700 transition-colors duration-200";
        logoutA.textContent = "Cerrar Sesión";
        logoutA.addEventListener("click", (e) => {
          e.preventDefault();
          logout();
        });
        logoutLi.appendChild(logoutA);
        menuContainer.appendChild(logoutLi);
      } catch (error) {
        console.error("Error loading sidebar menu:", error);
      }
    }
    async function loadPaymentSection() {
      try {
        const paymentSection = document.getElementById('payment');
        if (!paymentSection) {
          throw new Error("Sección de pagos no encontrada");
        }
        const response = await fetch('/paymentMethod.html');
        if (!response.ok) {
          throw new Error('Error cargando el template de pagos');
        }
        const content = await response.text();
        paymentSection.innerHTML = content;
        paymentSection.classList.remove('hidden');
        const user = getCurrentUser();
        if (!user || !user.id) {
          console.log("Estado actual del usuario:", user);
          console.log("localStorage:", localStorage);
          showError('Usuario no encontrado o no autenticado');
          return;
        }
        await loadUserPayments(user);
      } catch (error) {
        console.error("Error cargando la sección de pagos:", error);
        showError("No se pudo cargar la sección de pagos. Por favor, intente más tarde.");
      }
    }
    async function loadUserPayments(user = null) {
      try {
        if (!user) {
          user = getCurrentUser();
        }
        if (!user || !user.id) {
          throw new Error('Usuario no encontrado o no autenticado');
        }
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        const params = new URLSearchParams(window.location.search);
        const paymentId = params.get('payment');
        let statusResponse;
        if (paymentId) {
          statusResponse = await fetch(`/api/payments/payment-status/${paymentId}`, { 
            method: 'GET',
            headers 
          });
          if (!statusResponse.ok) {
            if (statusResponse.status === 404) {
              console.warn('Pago específico no encontrado:', paymentId);
            } else {
              const contentType = statusResponse.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                window.location.href = "/index.html";
                return;
              } else {
                throw new Error('Error de servidor al obtener el estado del pago');
              }
            }
            if (statusResponse.status === 403) {
              localStorage.removeItem('token');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userLink');
              localStorage.removeItem('user');
              window.location.replace('/index.html');
              return;
            }
          }
        }
        if (!paymentId || !statusResponse?.ok) {
          statusResponse = await fetch(`/api/payments/status/${user.id}`, {
            method: 'GET',
            headers 
          });
          if (!statusResponse.ok) {
            const contentType = statusResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              window.location.href = "/index.html";
              return;
            } else {
              throw new Error('Error de servidor al obtener el estado de la suscripción');
            }
          }
        }
        const statusData = await statusResponse.json();
        updateSubscriptionStatus(statusData);
        let paymentsResponse;
        try {
          paymentsResponse = await fetch(`/api/payments/user/${user.id}`, { headers });
        } catch (e) {
          if (user.email) {
            paymentsResponse = await fetch(`/api/payments/${encodeURIComponent(user.email)}`, { headers });
          } else {
            throw new Error('No se pudo obtener el historial de pagos');
          }
        }
        if (!paymentsResponse.ok && paymentsResponse.status !== 404) {
          const contentType = paymentsResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await paymentsResponse.json();
            throw new Error(errorData.error || 'Error al obtener el historial de pagos');
          } else {
            throw new Error('Error de servidor al obtener el historial de pagos');
          }
        }
        if (!paymentsResponse.ok && paymentsResponse.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userLink');
          localStorage.removeItem('user');
          window.location.replace('/index.html');
          return;
        }
        const payments = paymentsResponse.ok ? await paymentsResponse.json() : [];
        renderPaymentsTable(payments);
      } catch (error) {
        console.error('Error en loadUserPayments:', error);
        showError(error.message);
        if (error.message.includes('token') || error.message.includes('autenticación')) {
          setTimeout(() => {
            window.location.href = "/index.html";
          }, 2000);
        }
      }
    }
    function updateSubscriptionStatus(data) {
      const subscriptionData = Array.isArray(data) ? data[0] : data;
      if (!subscriptionData) return;
      const elements = {
        status: document.getElementById('subscriptionStatus'),
        lastPayment: document.getElementById('lastPaymentDate'),
        nextPayment: document.getElementById('nextPaymentDate'),
        daysRemaining: document.getElementById('daysRemaining')
      };
      let statusText = 'Activa';
      let statusColor = 'text-green-600';
      if (subscriptionData.status === 'warning') {
        statusText = 'Por vencer';
        statusColor = 'text-yellow-600';
      } else if (subscriptionData.status === 'expired' || subscriptionData.status === 'inactive') {
        statusText = 'Expirada';
        statusColor = 'text-red-600';
      }
      elements.status.textContent = statusText;
      elements.status.className = `font-semibold ${statusColor}`;
      elements.lastPayment.textContent = subscriptionData.paymentDate ? new Date(subscriptionData.paymentDate).toLocaleDateString() : 'N/A';
      elements.nextPayment.textContent = subscriptionData.nextPaymentDate ? new Date(subscriptionData.nextPaymentDate).toLocaleDateString() : 'N/A';
      elements.daysRemaining.textContent = `${subscriptionData.daysRemaining || 0} días`;
      const buttonContainer = document.getElementById('paymentButtonContainer');
      if (subscriptionData.status !== 'active' && buttonContainer) {
        buttonContainer.innerHTML = `
          <button id="renewSubscriptionBtn" 
                  class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            ${subscriptionData.status === 'inactive' ? 'Suscribirse' : 'Renovar suscripción'}
          </button>
        `;
        document.getElementById('renewSubscriptionBtn').addEventListener('click', handlePayment);
      }
    }
    function renderPaymentsTable(payments) {
      const tbody = document.getElementById('paymentsTableBody');
      if (!tbody) return;
      if (!payments || payments.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4 text-gray-500">No hay pagos registrados</td>
          </tr>
        `;
        return;
      }
      tbody.innerHTML = payments.map(payment => `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.paymentId}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${new Date(payment.paymentDate).toLocaleDateString()}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            $${payment.amount.toFixed(2)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${payment.status === 'approved' ? 'bg-green-100 text-green-800' : 
                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}">
              ${payment.status}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${payment.nextPaymentDate ? new Date(payment.nextPaymentDate).toLocaleDateString() : 'N/A'}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${payment.blockedPaymentDate ? new Date(payment.blockedPaymentDate).toLocaleDateString() : 'N/A'}
          </td>
        </tr>
      `).join('');
    }
    function showError(message) {
      const errorDiv = document.getElementById('error');
      if (errorDiv) {
        errorDiv.textContent = message;
      } else {
        const newErrorDiv = document.createElement('div');
        newErrorDiv.id = 'error';
        newErrorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4';
        newErrorDiv.textContent = message;
        const mainContent = document.querySelector('main');
        if (mainContent) {
          mainContent.insertBefore(newErrorDiv, mainContent.firstChild);
        }
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
        if (section.id === sectionId) {
          section.classList.add('active');
          section.classList.remove('hidden');
        } else {
          section.classList.remove('active');
          section.classList.add('hidden');
        }
      });
      if (!document.getElementById(sectionId)) {
        console.error(`Sección no encontrada: ${sectionId}`);
        showError(`Sección ${sectionId} no encontrada.`);
        showDefaultSection();
      }
    }
    function showDefaultSection() {
      const user = getCurrentUser();
      const defaultSection = user?.accessibleSections[0] || "cardGame";
      document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
      });
      const section = document.getElementById(defaultSection);
      if (section) {
        section.classList.add('active');
        section.classList.remove('hidden');
        const menuItems = document.querySelectorAll('#menu-items a');
        menuItems.forEach(item => {
          if (item.dataset.section === defaultSection) {
            item.classList.add('bg-blue-700');
          } else {
            item.classList.remove('bg-blue-700');
          }
        });
      } else {
        console.error(`Sección por defecto (${defaultSection}) no encontrada.`);
        document.getElementById('error').textContent = "Error: No se pudo cargar la sección por defecto.";
      }
    }
    function setupAdminLogic() {
      const generarBtn = document.getElementById('generarBtn');
      if (generarBtn) {
        generarBtn.addEventListener('click', async () => {
          const nombre1 = document.getElementById('nombreUsuario1').value;
          const nombre2 = document.getElementById('nombreUsuario2').value;
          const juegos = document.querySelector('input[name="juego"]:checked');
          const errorDiv = document.getElementById('error');
          if (!nombre1 || !nombre2) {
            errorDiv.textContent = "Por favor, ingrese ambos nombres de usuario.";
            return;
          }
          if (!juegos) {
            errorDiv.textContent = "Por favor, selecciona un juego.";
            return;
          }
          const gameType = juegos.value;
          const listaSelecciones = document.getElementById('listaSelecciones');
          if (listaSelecciones) {
            listaSelecciones.innerHTML = '';
          }
          initializePlayerSection(nombre1, gameType);
          initializePlayerSection(nombre2, gameType);
          try {
            const response = await fetch(`/api/games/generar-enlaces?nombre1=${encodeURIComponent(nombre1)}&nombre2=${encodeURIComponent(nombre2)}&juego=${encodeURIComponent(gameType)}`, {
              method: 'GET',
              headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("token")
              }
            });
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
      try {
        const stateUser = state.users.find(u => u.id === state.currentUserId);
        if (stateUser) {
          return {
            ...stateUser,
            accessibleSections: ["cardGame", "game2", "game3", "payment", "assistance"]
          };
        }
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            return {
              ...parsedUser,
              accessibleSections: ["cardGame", "game2", "game3", "payment", "assistance"]
            };
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          return {
            id: userEmail,
            email: userEmail,
            name: userEmail.split('@')[0],
            accessibleSections: ["cardGame", "game2", "game3", "payment", "assistance"]
          };
        }
        console.warn('No se encontró información del usuario');
        return { accessibleSections: ["cardGame", "game2", "game3", "payment", "assistance"] };
      } catch (error) {
        console.error('Error en getCurrentUser:', error);
        return { accessibleSections: ["cardGame", "game2", "game3", "payment", "assistance"] };
      }
    }
    function logout() {
      ["accessToken", "creditCardPayments", "refreshToken", "token", "userEmail", "userLink"].forEach(k => localStorage.removeItem(k));
      window.location.href = "/index.html";
    }
    function setupGenerarEnlaces() {
      const generarBtn = document.getElementById('generarBtn');
      if (!generarBtn) return;
      generarBtn.addEventListener('click', async () => {
        const nombreUsuario1 = document.getElementById('nombreUsuario1').value;
        const nombreUsuario2 = document.getElementById('nombreUsuario2').value;
        const juegos = document.querySelector('input[name="juego"]:checked');
        const errorDiv = document.getElementById('error');
        if (!nombreUsuario1 || !nombreUsuario2) {
          errorDiv.textContent = 'Por favor, ingrese ambos nombres de usuario.';
          return;
        }
        if (!juegos) {
          errorDiv.textContent = 'Por favor, seleccione un juego.';
          return;
        }
        try {
          const response = await fetch('/api/games/generar-enlaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario1: nombreUsuario1, usuario2: nombreUsuario2, juego: juegos.value })
          });
          if (!response.ok) {
            throw new Error(`Error generando enlaces: ${response.status}`);
          }
          const { enlace1, enlace2 } = await response.json();
          document.getElementById('enlaceGenerado1').value = enlace1;
          document.getElementById('enlaceGenerado2').value = enlace2;
          errorDiv.textContent = '';
          initializePlayerSection(nombreUsuario1);
          initializePlayerSection(nombreUsuario2);
        } catch (error) {
          errorDiv.textContent = `Error al generar enlaces: ${error.message}`;
        }
      });
    }
    function initializePlayerSection(playerName, gameType = 'besos') {
      const listaSelecciones = document.getElementById('listaSelecciones');
      const existingSection = document.getElementById(`player-${playerName}`);
      if (existingSection) {
        existingSection.querySelector('.cards-container').dataset.gameType = gameType;
        return existingSection;
      }
      const playerDiv = document.createElement('div');
      playerDiv.id = `player-${playerName}`;
      playerDiv.className = 'bg-white rounded-lg shadow-md p-4 mb-4';
      playerDiv.innerHTML = `
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-lg font-semibold text-gray-800">${playerName}</h4>
          <div class="player-stats flex space-x-4">
            <span class="selected-count text-sm text-gray-600">Cartas seleccionadas: 0</span>
          </div>
        </div>
        <div class="cards-container" id="cards-${playerName}" data-game-type="${gameType}">
          <div class="first-card-container"></div>
          <div class="other-cards-container"></div>
        </div>
      `;
      listaSelecciones.appendChild(playerDiv);
      return playerDiv;
    }
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    function generateCardValues(gameType) {
      const values = [];
      const maxPairs = totalCards / 2;
      let availableQuestions = [];
      if (gameType === 'besos') {
        availableQuestions = QuestionKiss.slice(0, maxPairs);
      } else if (gameType === 'fuego') {
        availableQuestions = QuestionFire.slice(0, maxPairs);
      } else if (gameType === 'rayo') {
        availableQuestions = QuestionTruth.slice(0, maxPairs);
      }
      for (let i = 0; i < maxPairs; i++) {
        values.push({ question: availableQuestions[i], number: (i * 2) + 1 });
        values.push({ question: availableQuestions[i], number: (i * 2) + 2 });
      }
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }
      return values;
    }
    function setupSocketListeners() {
      const playerStates = new Map();
      function handleCardUpdate(user, cartaId, pregunta, flipped, gameType, timestamp) {
        let playerSection = document.getElementById(`player-${user}`);
        if (!playerSection) {
          console.log(`Creando nueva sección para jugador ${user}`);
          playerSection = initializePlayerSection(user, gameType || 'besos');
        }
        const playerCards = document.getElementById(`cards-${user}`);
        if (!playerCards) {
          console.error('No se encontró la sección de cartas del jugador');
          return;
        }
        let userState = playerStates.get(user);
        if (!userState) {
          userState = {
            selectedCards: new Set(),
            firstCard: null,
            lastUpdate: 0
          };
          playerStates.set(user, userState);
        }
        if (timestamp && timestamp <= userState.lastUpdate) return;
        userState.lastUpdate = timestamp || Date.now();
        let card = playerCards.querySelector(`.card[data-carta-id="${cartaId}"]`);
        if (!card) {
          console.log('Creando nueva carta:', cartaId);
          const currentGameType = playerCards.dataset.gameType || gameType || 'besos';
          const cardNumber = Math.floor(Math.random() * totalCards) + 1;
          card = createCardElement(cartaId, currentGameType, pregunta, cardNumber);
        }
        if (flipped) {
          if (userState.firstCard && userState.firstCard !== cartaId) {
            const oldFirstCard = playerCards.querySelector(`.card[data-carta-id="${userState.firstCard}"]`);
            if (oldFirstCard) {
              oldFirstCard.classList.remove('first-selected');
              oldFirstCard.classList.add('other-selected');
              playerCards.querySelector('.other-cards-container').appendChild(oldFirstCard);
            }
          }
          userState.firstCard = cartaId;
          card.classList.add('first-selected');
          card.classList.remove('other-selected');
          playerCards.querySelector('.first-card-container').appendChild(card);
        } else {
          playerCards.querySelector('.other-cards-container').appendChild(card);
        }
        card.style.transition = 'all 0.3s ease-in-out';
        if (flipped) {
          card.classList.add('active', 'flip');
          userState.selectedCards.add(cartaId);
          if (cartaId === userState.firstCard) {
            card.classList.add('first-selected');
            card.classList.remove('other-selected');
            const firstContainer = playerCards.querySelector('.first-card-container');
            if (card.parentElement !== firstContainer) {
              firstContainer.appendChild(card);
            }
          } else {
            card.classList.add('other-selected');
            card.classList.remove('first-selected');
            const otherContainer = playerCards.querySelector('.other-cards-container');
            if (card.parentElement !== otherContainer) {
              otherContainer.appendChild(card);
            }
          }
          card.style.transform = 'scale(1.05) rotateY(180deg)';
        } else {
          card.classList.remove('active', 'flip', 'first-selected', 'other-selected');
          userState.selectedCards.delete(cartaId);
          if (cartaId === userState.firstCard) {
            userState.firstCard = null;
          }
          card.style.transform = '';
          const otherContainer = playerCards.querySelector('.other-cards-container');
          otherContainer.appendChild(card);
        }
        updatePlayerStats(playerSection, userState);
      }
      socket.on('actualizacionCarta', ({ user, cartaId, pregunta, flipped, selected, timestamp, gameType = 'besos' }) => {
        console.log('Recibida actualización de carta:', { user, cartaId, flipped, gameType });
        handleCardUpdate(user, cartaId, pregunta, flipped, gameType, timestamp);
      });
      socket.on('seleccionCartas', ({ user, cartas }) => {
        const playerSection = document.getElementById(`player-${user}`);
        if (!playerSection) return;
        const playerCards = document.getElementById(`cards-${user}`);
        if (!playerCards) return;
        playerCards.querySelectorAll('.card').forEach(card => {
          const isSelected = cartas.includes(card.dataset.cartaId);
          card.classList.toggle('seleccionada', isSelected);
        });
        const userState = playerStates.get(user);
        if (userState) {
          updatePlayerStats(playerSection, userState);
        }
      });
      socket.on('estadoJuego', ({ players }) => {
        Object.entries(players).forEach(([nombre, estado]) => {
          const playerSection = document.getElementById(`player-${nombre}`);
          if (!playerSection) return;
          let userState = playerStates.get(nombre);
          if (!userState) {
            userState = {
              selectedCards: new Set(estado.selectedCards),
              firstCard: estado.firstCard,
              lastUpdate: estado.timestamp
            };
            playerStates.set(nombre, userState);
          }
          updatePlayerStats(playerSection, userState);
        });
      });
      socket.on('connect_error', (err) => {
        document.getElementById('error').textContent = `Error de conexión con el servidor: ${err.message}`;
      });
    }
    function updatePlayerStats(playerSection, playerState) {
      const statsEl = playerSection.querySelector('.player-stats');
      if (statsEl) {
        statsEl.innerHTML = `
          <span class="selected-count font-medium">
            Cartas seleccionadas: ${playerState.selectedCards.size}
          </span>
        `;
      }
    }
    function highlightPlayerSection(section) {
      section.style.transition = 'all 0.3s ease';
      section.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      setTimeout(() => {
        section.style.backgroundColor = '';
      }, 500);
    }
    async function handlePayment() {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          throw new Error('Usuario no encontrado');
        }
        const response = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            userId: user.id,
            amount: 200
          })
        });
        if (!response.ok) {
          throw new Error('Error al procesar el pago');
        }
        const data = await response.json();
        if (data.init_point) {
          window.location.href = data.init_point;
        } else {
          throw new Error('No se recibió el punto de inicio del pago');
        }
      } catch (error) {
        console.error('Error:', error);
        showError(error.message);
      }
    }
    function setupClickRadioButton() {
      const radioButtons = document.querySelectorAll('input[name="juego"]');
      radioButtons.forEach(radio => {
        radio.addEventListener('change', async (e) => {
          const gameType = e.target.value;
          const gameTypeContainer = document.getElementById('game-type-container');
          switch(gameType) {
            case 'besos':
              setupCards(gameType);
              break;
            case 'fuego':
              setupCards(gameType);
              break;
            case 'rayo':
              setupCards(gameType);
              break;
            default:
              gameTypeContainer?.classList.add('hidden');
              break;
          }
        });
      });
    }
    function setupCards(gameType) {
      const gameDiv = document.getElementById('game');
      if (!gameDiv) {
        showError('Error: No se encontró el contenedor del juego.');
        return;
      }
      gameDiv.innerHTML = '';
      cards = [];
      valuesUsed = [];
      const cardValues = generateCardValues(gameType);
      cardValues.forEach((cardData, index) => {
        const div = document.createElement('div');
        div.innerHTML = `<div class="card ${gameType}"><div class="back">${cardData.number}</div><div class="face"></div></div>`;
        const card = div.querySelector('.card');
        card.dataset.cartaId = cardData.question;
        const face = div.querySelector('.face');
        face.innerText = cardData.question;
        if (gameType === 'fuego') {
          face.style.color = 'red';
          face.style.borderColor = 'red';
        } else if (gameType === 'rayo') {
          face.style.color = 'gold';
          face.style.borderColor = 'gold';
        } else {
          face.style.color = 'pink';
          face.style.borderColor = 'pink';
        }
        card.addEventListener('click', (e) => activate(e));
        cards.push(div);
        gameDiv.appendChild(div);
      });
    }
    function generateCardValues(gameType) {
      const values = [];
      const maxPairs = totalCards / 2;
      let availableQuestions = [];
      if (gameType === 'besos') {
        availableQuestions = QuestionKiss.slice(0, maxPairs);
      } else if (gameType === 'fuego') {
        availableQuestions = QuestionFire.slice(0, maxPairs);
      } else if (gameType === 'rayo') {
        availableQuestions = QuestionTruth.slice(0, maxPairs);
      }
      for (let i = 0; i < maxPairs; i++) {
        values.push({ question: availableQuestions[i], number: (i * 2) + 1 });
        values.push({ question: availableQuestions[i], number: (i * 2) + 2 });
      }
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }
      return values;
    }
    function activate(e) {
      const card = e.currentTarget;
      const isFlipped = card.classList.toggle('flip');
      const cartaName = card.dataset.cartaId;
      if (currentMove === 2) {
        currentAttempts++;
        document.getElementById('stats').textContent = `${currentAttempts} intentos`;
        const activeCards = document.querySelectorAll('.card.flip:not(.matched)');
        if (activeCards.length === 2) {
          const [card1, card2] = activeCards;
          if (card1.dataset.cartaId === card2.dataset.cartaId) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            socket.emit('cardFlipped', {
              token,
              cartaId: card1.dataset.cartaId,
              flipped: true,
              matched: true,
              selected: selecciones.includes(card1.dataset.cartaId)
            });
            currentMove = 0;
          } else {
            setTimeout(() => {
              card1.classList.remove('flip');
              card2.classList.remove('flip');
              const index1 = selecciones.indexOf(card1.dataset.cartaId);
              const index2 = selecciones.indexOf(card2.dataset.cartaId);
              if (index1 !== -1) selecciones.splice(index1, 1);
              if (index2 !== -1) selecciones.splice(index2, 1);
              console.log('Selecciones actuales:', selecciones);
              socket.emit('cardFlipped', {
                token,
                cartaId: card1.dataset.cartaId,
                flipped: false,
                matched: false,
                selected: false
              });
              socket.emit('cardFlipped', {
                token,
                cartaId: card2.dataset.cartaId,
                flipped: false,
                matched: false,
                selected: false
              });
              currentMove = 0;
              updateEnviarButton();
            }, 600);
          }
        }
      }
      updateEnviarButton();
    }
    function updateEnviarButton() {
      const enviarBtn = document.getElementById('enviarBtn');
      if (enviarBtn) {
        enviarBtn.disabled = selecciones.length === 0;
      }
    }