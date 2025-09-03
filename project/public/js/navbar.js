document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const navbar = document.querySelector('nav');
  let isMenuOpen = false;
  let lastScroll = 0;

  function updateMenuHeight() {
    if (!mobileMenu) return;
    const menuContent = mobileMenu.querySelector('div');
    const menuHeight = menuContent ? menuContent.scrollHeight : 0;
    if (isMenuOpen) {
      mobileMenu.style.height = `${menuHeight}px`;
    }
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function() {
      isMenuOpen = !isMenuOpen;
      
      // Actualizar el ícono del menú
      menuToggle.innerHTML = isMenuOpen 
        ? `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>`
        : `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>`;
      
      // Expandir/contraer el menú
      updateMenuHeight();
    });

    // Cerrar el menú cuando se hace clic en un enlace
    mobileMenu.querySelectorAll('a, button').forEach(item => {
      item.addEventListener('click', () => {
        isMenuOpen = false;
        mobileMenu.style.height = '0';
        menuToggle.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
        </svg>`;
      });
    });

    // Actualizar altura del menú en resize
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 768) { // 768px es el breakpoint md de Tailwind
        isMenuOpen = false;
        mobileMenu.style.height = '0';
        menuToggle.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
        </svg>`;
      } else if (isMenuOpen) {
        updateMenuHeight();
      }
    });
  }
});
