 document.addEventListener('DOMContentLoaded', () => {

    const btnIdGame = document.getElementById('btnIdGame');
    const spinnerGame = document.getElementById('spinnerGame');
    const txtNameGame = document.getElementById('txtNameGame');
    const txtDescriptionGame = document.getElementById('txtDescriptionGame');
    const txtSlugGame = document.getElementById('txtSlugGame');

    const navLinks = document.querySelectorAll('nav a[data-section]');
    const sections = document.querySelectorAll('div[data-section]');
    
    navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default anchor behavior
        
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('bg-blue-50', 'dark:bg-blue-900/30', 'text-blue-600', 'dark:text-blue-400', 'active-section'));
        
        // Add active class to clicked link
        link.classList.add('bg-blue-50', 'dark:bg-blue-900/30', 'text-blue-600', 'dark:text-blue-400', 'active-section');
        
        // Hide all sections
        sections.forEach(section => section.classList.add('hidden'));
        
        // Show the selected section
        const sectionId = link.getAttribute('data-section');
        const targetSection = document.querySelector(`div[data-section="${sectionId}"]`);
        if (targetSection) {
        targetSection.classList.remove('hidden');
        }
    });
    });

    btnIdGame.addEventListener('click', async (e) => {
        e.preventDefault();

        if (txtNameGame.value === '' || txtDescriptionGame.value === '' || txtSlugGame.value === '') {
            showToast('Por favor, ingresa el nombre, la descripción y el slug del juego', 'warning');
            return;
        }

        // Validar slug
        if (!/^[a-z0-9-]+$/.test(txtSlugGame.value)) {
            showToast('El slug solo puede contener letras minúsculas, números y guiones', 'warning');
            return;
        }

        // Mostrar spinner y desactivar botón
        spinnerGame.classList.remove('hidden');
        btnIdGame.disabled = true;
        btnIdGame.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            const res = await fetch('/api/settings/games/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: txtNameGame.value,
                    slug: txtSlugGame.value,
                    description: txtDescriptionGame.value,
                })
        });

        if (!res.ok) throw new Error('Error al crear el juego');
            txtNameGame.value = '';
            txtDescriptionGame.value = '';
            txtSlugGame.value = '';
            showToast('Juego creado con éxito', 'success');
        } catch (err) {
            console.error(err);
            showToast('Error al crear el juego', 'error');
        } finally {
            // Ocultar spinner y reactivar botón
            spinnerGame.classList.add('hidden');
            btnIdGame.disabled = false;
            btnIdGame.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
});