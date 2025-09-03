const App = {
    user: null,
    sections: {},

    async init() {
        await this.loadNavbar();
        await this.fetchUser();
        this.setupEventListeners();
        this.setupSections();
    },

    async loadNavbar() {
        try {
            const response = await fetch('navbar.html');
            document.getElementById('navbar-container').innerHTML = await response.text();
            document.getElementById('menu-toggle')?.addEventListener('click', () => {
                document.getElementById('mobile-menu')?.classList.toggle('hidden');
            });
        } catch (err) {
            console.error("❌ Error cargando navbar:", err);
        }
    },

    async fetchUser() {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                this.user = JSON.parse(storedUser);
                this.renderUser();
            } else {
                const res = await fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                });
                const data = await res.json();
                if (data.length > 0) {
                    this.user = data[0];
                    this.renderUser();
                }
            }
        } catch (err) {
            console.error("❌ Error obteniendo usuario:", err);
        }
    },

    renderUser() {
        document.getElementById('user-name').textContent = this.user.name || '';
        document.getElementById('user-email').textContent = this.user.email || '';
        document.getElementById('user-phone').textContent = this.user.phone || '';
    },

    setupEventListeners() {
        // Configurar el botón de enviar mensaje de soporte
        const supportButton = document.getElementById('sendSupportMessage');
        if (supportButton) {
            supportButton.addEventListener('click', () => {
                const message = document.getElementById('supportMessage').value;
                if (message) {
                    alert('Mensaje enviado al soporte: ' + message);
                    document.getElementById('supportMessage').value = '';
                } else {
                    alert('Por favor, escribe un mensaje');
                }
            });
        }

        // Configurar el botón de jugar trivia
        const triviaButton = document.getElementById('playTrivia');
        if (triviaButton) {
            triviaButton.addEventListener('click', () => {
                alert('¡Iniciando Trivia!');
            });
        }

        // Configurar el botón de jugar memoria
        const memoriaButton = document.getElementById('playMemoria');
        if (memoriaButton) {
            memoriaButton.addEventListener('click', () => {
                alert('¡Iniciando Memoria!');
            });
        }

        // Configurar botón de cerrar sesión
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.logout());
        }
    },

    setupSections() {
        // Registrar todas las secciones disponibles
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            this.sections[section.id] = {
                element: section,
                initialize: () => {
                    // Inicialización específica para cada sección
                    switch(section.id) {
                        case 'payment':
                            this.initializePaymentSection();
                            break;
                        case 'cardGame':
                            this.initializeCardGame();
                            break;
                        // Agregar más casos según sea necesario
                    }
                }
            };
        });
    },

    showSection(id) {
        console.log('Mostrando sección:', id); // Debug

        // Si no hay ID, mostrar la sección por defecto
        if (!id) {
            id = 'cardGame';
        }

        // Ocultar todas las secciones primero
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });

        // Intentar obtener la sección solicitada
        const section = document.getElementById(id);
        if (section) {
            console.log('Sección encontrada:', id); // Debug
            section.classList.remove('hidden');
            
            // Inicializar la sección si es necesario
            if (this.sections[id] && typeof this.sections[id].initialize === 'function') {
                console.log('Inicializando sección:', id); // Debug
                this.sections[id].initialize();
            }

            // Actualizar UI activa en el navbar si existe
            document.querySelectorAll('nav a').forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.includes(id)) {
                    link.classList.add('bg-blue-700');
                } else {
                    link.classList.remove('bg-blue-700');
                }
            });
        } else {
            console.error(`Sección no encontrada: ${id}`);
            // Mostrar sección por defecto si la solicitada no existe
            this.showSection('cardGame');
        }
    },

    // Funciones del Modal
    showModal() {
        document.getElementById('editModal').classList.remove('hidden');
        document.getElementById('edit-name').value = this.user?.name || '';
        document.getElementById('edit-email').value = this.user?.email || '';
        document.getElementById('edit-phone').value = this.user?.phone || '';
    },

    closeModal() {
        document.getElementById('editModal').classList.add('hidden');
    },

    async saveChanges() {
        const newName = document.getElementById('edit-name').value;
        const newPhone = document.getElementById('edit-phone').value;

        try {
            // Aquí iría la llamada a la API para guardar los cambios
            this.user = {
                ...this.user,
                name: newName,
                phone: newPhone
            };
            this.renderUser();
            this.closeModal();
            alert('Cambios guardados exitosamente');
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert('Error al guardar los cambios');
        }
    },

    // Funciones específicas de las secciones
    async initializePaymentSection() {
        const paymentSection = document.getElementById('payments-section');
        if (!paymentSection) return;

        try {
            if (!window.paymentModule) {
                const script = document.createElement('script');
                script.src = '/js/modules/payments.js';
                script.type = 'module';
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            await window.paymentModule.init();
        } catch (error) {
            console.error('Error inicializando sección de pagos:', error);
            paymentSection.innerHTML = '<p class="text-red-600">Error al cargar la sección de pagos</p>';
        }
    },

    initializeCardGame() {
        const container = document.getElementById('cards-container');
        if (!container) return;

        // Aquí iría la lógica de inicialización del juego de cartas
        console.log('Inicializando juego de cartas...');
    },

    // Función de logout
    logout() {
        localStorage.clear();
        window.location.href = '/index.html';
    }
};

// Inicializar la aplicación cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => App.init());

// Exportar App al objeto window para acceso global
window.App = App;