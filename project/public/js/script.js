let isAuthenticated = false;
let isRedirecting = false;

// Agregar estado inicial al historial
history.pushState(null, null, window.location.href);

// Detectar navegación hacia atrás
window.addEventListener('popstate', function() {
  // Si no está autenticado y no está en proceso de redirección, redirigir a index
  if (!isAuthenticated && !isRedirecting && !window.location.pathname.includes('index.html') && !window.location.pathname.includes('register.html')) {
    window.location.replace('/index.html');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const logoutButton = document.getElementById('logoutButton');
  const adminUsersTable = document.getElementById('adminUsersTable');
  const userContent = document.getElementById('userContent');
  const userEmailSpan = document.getElementById('userEmail');
  const loginEmailInput = document.getElementById('loginEmail');
  const loginPasswordInput = document.getElementById('loginPassword');
  const loginEmailError = document.getElementById('emailError');
  const loginPasswordError = document.getElementById('passwordError');
  const registerNameInput = document.getElementById('registerName');
  const registerNameError = document.getElementById('registerNameError');
  const registerEmailInput = document.getElementById('registerEmail');
  const registerPasswordInput = document.getElementById('registerPassword');
  const registerEmailError = document.getElementById('registerEmailError');
  const registerPasswordError = document.getElementById('registerPasswordError');
  const tableError = document.getElementById('tableError');
  const noUsers = document.getElementById('noUsers');

  // Función para verificar si el token ha expirado
  function isTokenExpired(token) {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() > expiry;
    } catch (error) {
      console.error('Error al verificar token:', error);
      return true;
    }
  }

  // Función para cerrar sesión
  function logout() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userLink');
      localStorage.removeItem('user');
      isAuthenticated = false;
      isRedirecting = true;
      
      // Limpiar historial para evitar navegación hacia atrás
      window.location.replace('/index.html');
      
      console.log('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión. Intenta de nuevo.');
    }
  }

  // Verificar autenticación al cargar la página
  const token = localStorage.getItem('token');
  isAuthenticated = token && !isTokenExpired(token);
  const userLink = localStorage.getItem('userLink');
  const userEmail = localStorage.getItem('userEmail');

  // Redirigir si el usuario está autenticado y está en index.html o register.html
  if (isAuthenticated && (window.location.pathname === '/index.html' || window.location.pathname === '/register.html' || window.location.pathname === '/')) {
    console.log('Usuario autenticado detectado en página de login/registro, redirigiendo...');
    isRedirecting = true;
    fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.role === 'admin') {
          window.location.href = '/admin.html';
        } else if (userLink) {
          window.location.href = userLink;
        } else {
          console.warn('No se encontró userLink, cerrando sesión');
          logout();
        }
      })
      .catch(error => {
        console.error('Error al verificar rol:', error);
        logout();
      });
  }

  // Verificar token en páginas protegidas
  if (adminUsersTable || userContent) {
    if (!isAuthenticated) {
      alert('Sesión expirada o no iniciada. Por favor, inicia sesión.');
      logout();
    }
  }

  // Validación del formulario de login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Resetear estilos de error
      loginEmailInput.classList.remove('border-red-500');
      loginPasswordInput.classList.remove('border-red-500');
      loginEmailError.classList.add('hidden');
      loginPasswordError.classList.add('hidden');

      // Validar campos vacíos
      let hasError = false;
      if (!loginEmailInput.value.trim()) {
        loginEmailInput.classList.add('border-red-500');
        loginEmailError.classList.remove('hidden');
        hasError = true;
      }
      if (!loginPasswordInput.value.trim()) {
        loginPasswordInput.classList.add('border-red-500');
        loginPasswordError.classList.remove('hidden');
        hasError = true;
      }

      if (hasError) return;

      // Proceder con el login
      const email = loginEmailInput.value;
      const password = loginPasswordInput.value;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('userLink', data.link);
          isAuthenticated = true;
          isRedirecting = true;
          if (data.link && data.role !== 'admin') {
            window.location.href = data.link;
          } else {
            window.location.href = '/dashboard.html';
          }
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('Error al iniciar sesión');
      }
    });
  }

  // Validación del formulario de registro
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Resetear estilos de error
      registerNameError.classList.remove('border-red-500');
      registerEmailInput.classList.remove('border-red-500');
      registerPasswordInput.classList.remove('border-red-500');
      registerEmailError.classList.add('hidden');
      registerPasswordError.classList.add('hidden');

      // Validar campos vacíos
      let hasError = false;
      if (!registerEmailInput.value.trim()) {
        registerEmailInput.classList.add('border-red-500');
        registerEmailError.classList.remove('hidden');
        hasError = true;
      }
      if (!registerPasswordInput.value.trim()) {
        registerPasswordInput.classList.add('border-red-500');
        registerPasswordError.classList.remove('hidden');
        hasError = true;
      }
      if (!registerNameInput.value.trim()) {
        registerNameInput.classList.add('border-red-500');
        registerNameError.classList.remove('hidden');
        hasError = true;
      }

      if (hasError) return;

      // Proceder con el registro
      const name = registerNameInput.value;
      const email = registerEmailInput.value;
      const password = registerPasswordInput.value;

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (response.ok) {
          alert(`Registro exitoso! Tu enlace: ${data.link}`);
          isRedirecting = true;
          window.location.href = '/index.html';
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error('Error al registrarse:', error);
        alert('Error al registrarse');
      }
    });
  }

  // Logout
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      console.log('Botón de cerrar sesión clicado');
      logout();
    });
  } else if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('user-page')) {
    console.warn('No se encontró el elemento logoutButton en', window.location.pathname);
  }

  // Panel Admin: Cargar usuarios
  if (adminUsersTable) {
    fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(users => {
        if (users.length === 0) {
          noUsers.classList.remove('hidden');
          return;
        }
        users.forEach(user => {
          const row = adminUsersTable.insertRow();
          row.innerHTML = `
            <td class="p-2 border">${user.email}</td>
            <td class="p-2 border"><a href="${user.link}" target="_blank" class="text-blue-500 hover:underline">${user.link}</a></td>
            <td class="p-2 border">${JSON.stringify(user.soporte_estable)}</td>
            <td class="p-2 border">${user.suspended ? 'Sí' : 'No'}</td>
            <td class="p-2 border action-buttons">
              <button onclick="updateSupport(${user.id})" class="bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 mr-2">Editar Soporte</button>
              <button onclick="toggleSuspend(${user.id}, ${user.suspended})" class="bg-${user.suspended ? 'green' : 'red'}-500 text-white px-2 py-1 rounded-md hover:bg-${user.suspended ? 'green' : 'red'}-600">${user.suspended ? 'Activar' : 'Suspender'}</button>
            </td>
          `;
        });
      })
      .catch(error => {
        console.error('Error al cargar usuarios:', error);
        tableError.classList.remove('hidden');
      });
  }

  // Funciones de administración
  window.updateSupport = function (id) {
    const status = prompt('Nuevo estado de soporte (ej. activo, vencido):', 'activo');
    const fecha_venc = prompt('Fecha de vencimiento (YYYY-MM-DD):', '2025-12-31');
    if (status && fecha_venc) {
      fetch(`/api/admin/user/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ soporte_estable: { status, fecha_venc } })
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message);
          window.location.reload();
        })
        .catch(error => {
          console.error('Error al actualizar soporte:', error);
          alert('Error al actualizar soporte');
        });
    }
  };

  window.toggleSuspend = function (id, isSuspended) {
    if (confirm(`¿${isSuspended ? 'Activar' : 'Suspender'} este usuario?`)) {
      fetch(`/api/admin/user/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ suspended: !isSuspended })
      })
        .then(res => res.json())
        .then(data => {
          alert(data.message);
          window.location.reload();
        })
        .catch(error => {
          console.error('Error al cambiar estado:', error);
          alert('Error al cambiar estado');
        });
    }
  };

  // Página de usuario personalizada
  if (userContent) {
    if (!isAuthenticated) {
      alert('Sesión expirada o no iniciada. Por favor, inicia sesión.');
      logout();
    } else {
      userEmailSpan.textContent = userEmail;
    }
  }

  // Funciones del Dashboard
  window.showSection = function (sectionId) {
    document.querySelectorAll('.section').forEach(section => {
      section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
  };

  window.addPaymentMethod = function () {
    const cardNumber = document.getElementById('cardNumber').value;
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVC = document.getElementById('cardCVC').value;

    if (cardNumber && cardExpiry && cardCVC) {
      const paymentMethods = document.getElementById('paymentMethods');
      const methodDiv = document.createElement('div');
      methodDiv.className = 'flex justify-between items-center p-2 border-b';
      methodDiv.innerHTML = `
        <span>Tarjeta terminada en ${cardNumber.slice(-4)}</span>
        <button class="text-red-500 hover:underline" onclick="this.parentElement.remove()">Eliminar</button>
      `;
      paymentMethods.innerHTML = '';
      paymentMethods.appendChild(methodDiv);
      document.getElementById('cardNumber').value = '';
      document.getElementById('cardExpiry').value = '';
      document.getElementById('cardCVC').value = '';
      alert('Método de pago agregado');
    } else {
      alert('Por favor, completa todos los campos');
    }
  };

  window.sendSupportMessage = function () {
    const message = document.getElementById('supportMessage').value;
    if (message) {
      alert('Mensaje enviado al soporte: ' + message);
      document.getElementById('supportMessage').value = '';
    } else {
      alert('Por favor, escribe un mensaje');
    }
  };
});