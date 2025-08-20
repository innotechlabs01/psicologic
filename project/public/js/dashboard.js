const App = {
    user: null,

    async init() {
    await this.loadNavbar();
    await this.fetchUser();
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
        const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        if (data.length > 0) {
        this.user = data[0];
        this.renderUser();
        }
    } catch (err) {
        console.error("❌ Error obteniendo usuario:", err);
    }
    },

    renderUser() {
    document.getElementById('user-name').textContent = this.user.name;
    document.getElementById('user-email').textContent = this.user.email;
    document.getElementById('user-phone').textContent = this.user.phone;
    },

    showSection(id) {
    document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    },

    showModal() {
    document.getElementById('edit-name').value = this.user?.name || '';
    document.getElementById('edit-email').value = this.user?.email || '';
    document.getElementById('edit-phone').value = this.user?.phone || '';
    document.getElementById('editModal').classList.remove('hidden');
    },

    closeModal() {
    document.getElementById('editModal').classList.add('hidden');
    },

    saveChanges() {
    this.user.name = document.getElementById('edit-name').value;
    this.user.phone = document.getElementById('edit-phone').value;
    this.renderUser();
    this.closeModal();
    },

    addPaymentMethod() {
    console.warn("⚡ Método de pago agregado (simulación).");
    },

    sendSupportMessage() {
    console.warn("⚡ Mensaje de soporte enviado:", document.getElementById('supportMessage').value);
    },

    logout() {
    localStorage.clear();
    window.location.href = '/index.html';
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());