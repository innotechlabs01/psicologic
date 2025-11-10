document.addEventListener('DOMContentLoaded', () => {
  const API_URL = '/api/settings/api';
  const GAMES_API = '/api/games/api'; // 🆕 Endpoint que devuelve la lista de juegos
  const treeContainer = document.getElementById('treeContainer');

  if (!treeContainer) return;

  /**
   * 🔁 Renderiza recursivamente los menús y submenús
   */
  const renderMenuTree = (menuItems = [], userId = null) => {
    return menuItems
      .filter((item) => item.status !== false)
      .map((item) => {
        const nodeId = `N-${item.id}`;
        const checked = item.status ? 'checked' : '';
        const hasChildren = Array.isArray(item.subItem) && item.subItem.length > 0;

        // 🆕 Si el item es “Games”, agrega el botón ➕ al lado
        const isGames =
            ['juego', 'juegos', 'game', 'games'].includes(item.name?.toLowerCase?.());
        const addGameBtn = isGames
          ? `<button class="ml-2 text-green-600 hover:text-green-800 font-bold add-game-btn" 
                     data-user="${userId}" title="Agregar juego">＋</button>`
          : '';

        return `
          <li data-node-id="${nodeId}" class="${hasChildren ? 'tree-parent' : ''}">
            ${
              hasChildren
                ? `<span class="tree-toggle">▶</span>
                   <span class="tree-label font-medium">${item.name}</span>
                   ${addGameBtn}`
                : `<input type="checkbox" id="check-${nodeId}" ${checked}>
                   <label for="check-${nodeId}">${item.name}</label>`
            }
            ${
              hasChildren
                ? `<ul class="hidden">${renderMenuTree(item.subItem, userId)}</ul>`
                : ''
            }
          </li>
        `;
      })
      .join('');
  };

  /**
   * 👤 Renderiza cada usuario como padre con su menú debajo
   */
  const renderUserMenus = (users = []) => {
    return users
      .map((user) => {
        const username = user?.username || 'Usuario sin nombre';
        const menuList = user?.menu?.menu || [];

        return `
          <li class="tree-parent">
            <span class="tree-toggle">▶</span>
            <span class="tree-label font-semibold text-blue-600">${username}</span>
            <ul class="hidden">
              ${renderMenuTree(menuList, user.id)}
            </ul>
          </li>
        `;
      })
      .join('');
  };

  /**
   * 🚀 Inicializa el árbol principal
   */
  const initializeTree = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      const users = data?.settings || [];
      treeContainer.innerHTML = `<ul class="tree-root">${renderUserMenus(users)}</ul>`;

      attachTreeListeners(treeContainer);
      attachAddGameButtons(); // 🆕 Inicializa los botones +
    } catch (err) {
      console.error('❌ Error cargando árbol:', err);
    }
  };

  /**
   * 🎧 Listeners de interacción (expandir, colapsar, checkboxes)
   */
  const attachTreeListeners = (container) => {
    // Expandir / Colapsar nodos
    container.addEventListener('click', (e) => {
      const toggle = e.target.closest('.tree-toggle, .tree-label');
      if (!toggle) return;

      const li = toggle.closest('li.tree-parent');
      if (!li) return;

      li.classList.toggle('tree-open');
      const sublist = li.querySelector('ul');
      const icon = li.querySelector('.tree-toggle');

      if (sublist) {
        const isOpen = li.classList.contains('tree-open');
        sublist.classList.toggle('hidden', !isOpen);
        if (icon) icon.textContent = isOpen ? '▼' : '▶';
      }
    });

    // Checkboxes → actualizar backend
    container.addEventListener('change', async (e) => {
      if (e.target.type !== 'checkbox') return;
      const nodeId = e.target.id.replace('check-', '');
      updateBackend(nodeId, e.target.checked);
    });
  };

    /**
     * 🆕 Escucha el click en los botones “＋” para agregar juegos
     */
    const attachAddGameButtons = () => {
        treeContainer.addEventListener('click', async (e) => {
            const btn = e.target.closest('.add-game-btn');
            if (!btn) return;

            const userId = btn.dataset.user;
            const li = btn.closest('li');

            // Evita duplicar el formulario si ya está abierto
            if (li.querySelector('.add-game-form')) return;

            // Obtener lista de juegos del backend
            const games = await fetchGames();
            if (!games.length) {
            alert('No hay juegos disponibles.');
            return;
            }

            // Crear dropdown y botón dentro del árbol
            const formHtml = `
            <div class="add-game-form mt-2 ml-6 flex items-center gap-2">
                <input type="checkbox" id="new-game-check" class="cursor-pointer">
                <select id="new-game-select" class="border rounded px-2 py-1 text-sm">
                <option value="">Seleccione un juego</option>
                ${games.map((g) => `<option value="${g.id}">${g.name}</option>`).join('')}
                </select>
                <button class="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700 save-game-btn">
                Agregar
                </button>
                <button class="text-gray-500 text-xs px-2 py-1 cancel-add-game hover:text-gray-700">Cancelar</button>
            </div>
            `;

            li.insertAdjacentHTML('beforeend', formHtml);

            // Listener del botón "Agregar"
            li.querySelector('.save-game-btn').addEventListener('click', async () => {
            const select = li.querySelector('#new-game-select');
            const checkbox = li.querySelector('#new-game-check');
            const selectedGameId = select.value;

            if (!selectedGameId) {
                alert('Seleccione un juego.');
                return;
            }

            try {
                await addGameToUser(userId, selectedGameId);

                // Agregar visualmente el nuevo checkbox al árbol sin refrescar todo
                const gameName = games.find((g) => g.id == selectedGameId)?.name;
                const newNode = `
                <li data-node-id="N-${selectedGameId}">
                    <input type="checkbox" id="check-N-${selectedGameId}" checked>
                    <label for="check-N-${selectedGameId}">${gameName}</label>
                </li>
                `;
                const sublist = li.querySelector('ul') || (() => {
                const ul = document.createElement('ul');
                ul.classList.remove('hidden');
                li.appendChild(ul);
                return ul;
                })();
                sublist.insertAdjacentHTML('beforeend', newNode);

                // Quitar formulario
                li.querySelector('.add-game-form').remove();
            } catch (err) {
                console.error('❌ Error al agregar juego:', err);
                alert('Error al agregar el juego.');
            }
            });

            // Listener de “Cancelar”
            li.querySelector('.cancel-add-game').addEventListener('click', () => {
            li.querySelector('.add-game-form').remove();
            });
        });
    };

  /**
   * 🆕 Obtener lista de juegos desde el backend
   */
  const fetchGames = async () => {
    try {
      const res = await fetch(GAMES_API);
      const data = await res.json();
      return data.games || [];
    } catch (e) {
      console.error('Error obteniendo juegos:', e);
      return [];
    }
  };

  /**
   * 🆕 Agregar juego al usuario
   */
  const addGameToUser = async (userId, gameId) => {
    try {
      const res = await fetch(`${API_URL}/add-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, game_id: gameId }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const result = await res.json();
      alert(`✅ Juego agregado: ${result?.game?.name || 'Éxito'}`);
      initializeTree(); // Refrescar árbol
    } catch (err) {
      console.error('❌ Error agregando juego:', err);
      alert('Error al agregar juego.');
    }
  };

  /**
   * 📡 Envía los cambios al backend
   */
  const updateBackend = async (nodeId, isChecked) => {
    try {
      const response = await fetch(API_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: nodeId, is_active: isChecked }),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      console.log(`✅ Actualizado ${nodeId}: ${isChecked}`);
    } catch (err) {
      console.error('❌ Error actualizando backend:', err);
      const cb = document.getElementById(`check-${nodeId}`);
      if (cb) cb.checked = !isChecked;
    }
  };

  // Mantiene tu switchPanelClick sin cambios
  const switchPanelClick = () => {
    const navLinks = document.querySelectorAll('nav a[data-section]');
    const contentSections = document.querySelectorAll('.lg\\:col-span-2 > div[data-section]');
    const switchSection = (sectionId) => {
      contentSections.forEach((section) => section.classList.add('hidden'));
      navLinks.forEach((link) => {
        link.classList.remove(
          'bg-blue-50',
          'dark:bg-blue-900/30',
          'text-blue-600',
          'dark:text-blue-400',
          'font-medium',
          'active-section'
        );
        link.classList.add('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
      });
      const targetSection = document.getElementById(sectionId);
      if (targetSection) targetSection.classList.remove('hidden');
      const activeLink = document.querySelector(`nav a[data-section="${sectionId}"]`);
      if (activeLink) {
        activeLink.classList.add(
          'bg-blue-50',
          'dark:bg-blue-900/30',
          'text-blue-600',
          'dark:text-blue-400',
          'font-medium',
          'active-section'
        );
      }
    };
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('href').substring(1);
        switchSection(sectionId);
      });
    });
    const initialSection = window.location.hash ? window.location.hash.substring(1) : 'perfil';
    if (document.querySelector(`nav a[data-section="${initialSection}"]`)) {
      switchSection(initialSection);
    } else {
      switchSection('perfil');
    }
  };

  // 🏁 Iniciar
  initializeTree();
  switchPanelClick();
});
