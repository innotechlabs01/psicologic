document.addEventListener('DOMContentLoaded', function() {
    // Función para manejar el menú móvil
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('h-0');
            mobileMenu.classList.toggle('h-auto');
        });
    }

    // Reemplazar los enlaces con manejadores de eventos para las secciones
    const menuLinks = document.querySelectorAll('nav a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            
            // Mapear los enlaces a las secciones correspondientes
            const sectionMap = {
                'settings.html': 'settings',
                'paymentMethod.html': 'payment',
                'user.html': 'usuario',
                'dashboard.html': 'cardGame'  // Sección por defecto
            };

            const sectionId = sectionMap[href];
            if (sectionId && window.App) {
                window.App.showSection(sectionId);
                // Cerrar el menú móvil si está abierto
                if (mobileMenu) {
                    mobileMenu.classList.add('h-0');
                    mobileMenu.classList.remove('h-auto');
                }
            }
        });
    });

    // Manejar el botón de logout
    const logoutButtons = document.querySelectorAll('#logoutButton, #mobile-logoutButton');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.App) {
                window.App.logout();
            }
        });
    });
});
