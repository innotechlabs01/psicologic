// src/scripts/dashboard.js
class DashboardManager {
  constructor() {
    this.isLive = false;
    this.refreshInterval = null;
    this.lastUpdate = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadInitialData();
    this.startLiveUpdates();
  }

  setupEventListeners() {
    // Toggle live updates
    const liveToggle = document.getElementById('live-toggle');
    if (liveToggle) {
      liveToggle.addEventListener('change', (e) => {
        this.toggleLiveUpdates(e.target.checked);
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshData();
      });
    }

    // User status updates
    document.querySelectorAll('[data-user-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.dataset.userId;
        const action = e.target.dataset.userAction;
        this.handleUserAction(userId, action);
      });
    });

    // Alert resolution
    document.querySelectorAll('[data-alert-resolve]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const alertId = e.target.dataset.alertId;
        this.resolveAlert(alertId);
      });
    });

    // Search functionality
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterUsers(e.target.value);
      });
    }

    // Filters
    document.querySelectorAll('[data-filter]').forEach(filter => {
      filter.addEventListener('change', () => {
        this.applyFilters();
      });
    });
  }

  async loadInitialData() {
    try {
      this.showLoader('stats');
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      
      if (response.ok) {
        this.updateStats(data.stats);
        this.lastUpdate = new Date().toISOString();
        this.updateLastRefresh();
      } else {
        this.showError('Error cargando estadísticas: ' + data.error);
      }
    } catch (error) {
      this.showError('Error de conexión: ' + error.message);
    } finally {
      this.hideLoader('stats');
    }
  }

  toggleLiveUpdates(enabled) {
    this.isLive = enabled;
    
    if (enabled) {
      this.startLiveUpdates();
      this.showNotification('Actualizaciones en tiempo real activadas', 'success');
    } else {
      this.stopLiveUpdates();
      this.showNotification('Actualizaciones en tiempo real desactivadas', 'info');
    }
    
    // Update UI
    const indicator = document.getElementById('live-indicator');
    if (indicator) {
      indicator.className = enabled ? 
        'w-2 h-2 bg-green-400 rounded-full animate-pulse' : 
        'w-2 h-2 bg-gray-400 rounded-full';
    }
  }

  startLiveUpdates() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      if (this.isLive && document.visibilityState === 'visible') {
        this.refreshData();
      }
    }, 30000); // Actualizar cada 30 segundos
  }

  stopLiveUpdates() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  async refreshData() {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch(`/api/dashboard/activity?since=${this.lastUpdate}`)
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        this.updateStats(statsData.stats);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        this.updateActivity(activityData.activity);
        this.lastUpdate = activityData.timestamp;
      }

      this.updateLastRefresh();
      
      // Mostrar indicador de actualización
      this.showUpdateIndicator();

    } catch (error) {
      console.error('Error actualizando datos:', error);
      this.showError('Error actualizando datos');
    }
  }

  updateStats(stats) {
    // Actualizar contadores principales
    this.updateCounter('total-users', stats.users.total);
    this.updateCounter('active-users', stats.users.active);
    this.updateCounter('pending-users', stats.users.pending);
    this.updateCounter('today-access', stats.access.total);
    this.updateCounter('denied-attempts', stats.access.denied);
    this.updateCounter('active-alerts', stats.security.totalAlerts);

    // Actualizar gráficos de progreso
    this.updateProgressBar('active-progress', stats.users.active, stats.users.total);
    this.updateProgressBar('pending-progress', stats.users.pending, stats.users.total);
    
    // Actualizar distribución de roles
    this.updateRoleDistribution(stats.users.byRole);
  }

  updateCounter(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (element) {
      const currentValue = parseInt(element.textContent) || 0;
      
      if (newValue !== currentValue) {
        // Animación de cambio
        element.style.transform = 'scale(1.1)';
        element.style.color = newValue > currentValue ? '#10B981' : '#EF4444';
        
        setTimeout(() => {
          element.textContent = newValue;
          element.style.transform = 'scale(1)';
          element.style.color = '';
        }, 150);
      }
    }
  }

  updateProgressBar(elementId, value, total) {
    const element = document.getElementById(elementId);
    if (element && total > 0) {
      const percentage = (value / total) * 100;
      element.style.width = `${percentage}%`;
      element.setAttribute('aria-valuenow', percentage);
    }
  }

  updateActivity(newActivity) {
    if (!newActivity || newActivity.length === 0) return;

    const activityContainer = document.getElementById('recent-activity');
    if (!activityContainer) return;

    // Agregar nuevas actividades al principio
    newActivity.forEach(activity => {
      const activityElement = this.createActivityElement(activity);
      activityContainer.insertBefore(activityElement, activityContainer.firstChild);
    });

    // Mantener solo las últimas 10 actividades
    while (activityContainer.children.length > 10) {
      activityContainer.removeChild(activityContainer.lastChild);
    }

    // Resaltar nueva actividad
    newActivity.forEach((_, index) => {
      const element = activityContainer.children[index];
      element.classList.add('bg-yellow-50', 'border-yellow-200');
      setTimeout(() => {
        element.classList.remove('bg-yellow-50', 'border-yellow-200');
      }, 3000);
    });
  }

  createActivityElement(activity) {
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200';
    
    const icon = this.getActionIcon(activity.action);
    const time = this.formatTimeAgo(activity.timestamp);
    
    div.innerHTML = `
      ${icon}
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-900 truncate">${activity.email}</p>
        <p class="text-xs text-gray-500">${activity.action} en ${activity.route}</p>
      </div>
      <div class="text-xs text-gray-400">${time}</div>
    `;
    
    return div;
  }

  getActionIcon(action) {
    const icons = {
      login: '<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      access: '<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>',
      denied: '<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path></svg>'
    };
    return icons[action] || icons.access;
  }

  async handleUserAction(userId, action) {
    try {
      const confirmMessage = this.getConfirmMessage(action);
      if (!confirm(confirmMessage)) return;

      this.showLoader(`user-${userId}`);
      
      const response = await fetch(`/api/dashboard/user/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: action,
          notes: `Acción realizada desde dashboard: ${action}` 
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.showNotification(`Usuario ${action} correctamente`, 'success');
        this.refreshUserRow(userId, data.user);
      } else {
        this.showError('Error: ' + data.error);
      }
    } catch (error) {
      this.showError('Error de conexión: ' + error.message);
    } finally {
      this.hideLoader(`user-${userId}`);
    }
  }

  async resolveAlert(alertId) {
    try {
      const notes = prompt('Notas de resolución (opcional):');
      
      const response = await fetch(`/api/dashboard/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolution_notes: notes })
      });

      const data = await response.json();

      if (response.ok) {
        this.showNotification('Alerta resuelta correctamente', 'success');
        this.removeAlertRow(alertId);
      } else {
        this.showError('Error: ' + data.error);
      }
    } catch (error) {
      this.showError('Error de conexión: ' + error.message);
    }
  }

  filterUsers(searchTerm) {
    const rows = document.querySelectorAll('[data-user-row]');
    const term = searchTerm.toLowerCase();

    rows.forEach(row => {
      const email = row.dataset.userEmail?.toLowerCase() || '';
      const name = row.dataset.userName?.toLowerCase() || '';
      const visible = email.includes(term) || name.includes(term);
      
      row.style.display = visible ? '' : 'none';
    });
  }

  applyFilters() {
    const statusFilter = document.getElementById('status-filter')?.value;
    const roleFilter = document.getElementById('role-filter')?.value;
    const rows = document.querySelectorAll('[data-user-row]');

    rows.forEach(row => {
      let visible = true;
      
      if (statusFilter && row.dataset.userStatus !== statusFilter) {
        visible = false;
      }
      
      if (roleFilter && row.dataset.userRole !== roleFilter) {
        visible = false;
      }
      
      row.style.display = visible ? '' : 'none';
    });
  }

  // Funciones auxiliares
  getConfirmMessage(action) {
    const messages = {
      'active': '¿Confirmar activación del usuario?',
      'suspended': '¿Confirmar suspensión del usuario?',
      'pending_approval': '¿Marcar como pendiente de aprobación?'
    };
    return messages[action] || '¿Confirmar acción?';
  }

  formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
  }

  showLoader(elementId) {
    const element = document.getElementById(`loader-${elementId}`);
    if (element) {
      element.classList.remove('hidden');
    }
  }

  hideLoader(elementId) {
    const element = document.getElementById(`loader-${elementId}`);
    if (element) {
      element.classList.add('hidden');
    }
  }

  showNotification(message, type = 'info') {
    // Crear o actualizar notificación toast
    const toast = document.getElementById('toast') || this.createToast();
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg transition-transform duration-300 z-50`;
    toast.textContent = message;
    toast.style.transform = 'translateX(0)';

    // Auto-hide después de 4 segundos
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
    }, 4000);
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  createToast() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.transform = 'translateX(100%)';
    document.body.appendChild(toast);
    return toast;
  }

  updateLastRefresh() {
    const element = document.getElementById('last-refresh');
    if (element) {
      element.textContent = `Última actualización: ${new Date().toLocaleTimeString('es-ES')}`;
    }
  }

  showUpdateIndicator() {
    const indicator = document.getElementById('update-indicator');
    if (indicator) {
      indicator.classList.remove('hidden');
      indicator.classList.add('animate-pulse');
      
      setTimeout(() => {
        indicator.classList.add('hidden');
        indicator.classList.remove('animate-pulse');
      }, 1000);
    }
  }

  refreshUserRow(userId, userData) {
    const row = document.querySelector(`[data-user-id="${userId}"]`);
    if (row) {
      // Actualizar badge de estado
      const statusBadge = row.querySelector('.status-badge');
      if (statusBadge) {
        const statusColors = {
          'active': 'bg-green-100 text-green-800',
          'pending_approval': 'bg-yellow-100 text-yellow-800',
          'suspended': 'bg-red-100 text-red-800'
        };
        statusBadge.className = `status-badge inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[userData.status]}`;
        statusBadge.textContent = userData.status.replace('_', ' ');
      }

      // Actualizar datos del row
      row.dataset.userStatus = userData.status;
    }
  }

  removeAlertRow(alertId) {
    const row = document.querySelector(`[data-alert-id="${alertId}"]`);
    if (row) {
      row.style.transition = 'opacity 0.3s ease-out';
      row.style.opacity = '0';
      setTimeout(() => {
        row.remove();
      }, 300);
    }
  }

  updateRoleDistribution(roleData) {
    const total = roleData.admin + roleData.client + roleData.moderator;
    
    if (total === 0) return;

    // Actualizar gráfico de roles (si existe)
    const adminBar = document.getElementById('admin-role-bar');
    const clientBar = document.getElementById('client-role-bar');
    const moderatorBar = document.getElementById('moderator-role-bar');

    if (adminBar) {
      const adminPercentage = (roleData.admin / total) * 100;
      adminBar.style.width = `${adminPercentage}%`;
      adminBar.setAttribute('data-tooltip', `${roleData.admin} Admins (${adminPercentage.toFixed(1)}%)`);
    }

    if (clientBar) {
      const clientPercentage = (roleData.client / total) * 100;
      clientBar.style.width = `${clientPercentage}%`;
      clientBar.setAttribute('data-tooltip', `${roleData.client} Clients (${clientPercentage.toFixed(1)}%)`);
    }

    if (moderatorBar) {
      const moderatorPercentage = (roleData.moderator / total) * 100;
      moderatorBar.style.width = `${moderatorPercentage}%`;
      moderatorBar.setAttribute('data-tooltip', `${roleData.moderator} Moderators (${moderatorPercentage.toFixed(1)}%)`);
    }
  }

  // Cleanup al desmontar
  destroy() {
    this.stopLiveUpdates();
    
    // Remover event listeners si es necesario
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.isLive) {
      this.refreshData();
    }
  };
}

// Funciones auxiliares para el dashboard
class DashboardUtils {
  static exportData(type, data) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${type}_export_${timestamp}.csv`;
    
    let csvContent = '';
    
    if (type === 'users') {
      csvContent = this.arrayToCsv(data, [
        'email', 'first_name', 'last_name', 'role', 'status', 
        'login_count', 'last_login', 'created_at'
      ]);
    } else if (type === 'logs') {
      csvContent = this.arrayToCsv(data, [
        'email', 'action', 'route', 'ip_address', 'timestamp'
      ]);
    } else if (type === 'alerts') {
      csvContent = this.arrayToCsv(data, [
        'clerk_user_id', 'alert_type', 'severity', 'status', 'created_at'
      ]);
    }
    
    this.downloadCsv(csvContent, filename);
  }

  static arrayToCsv(array, columns) {
    if (!array || array.length === 0) return '';
    
    const header = columns.join(',');
    const rows = array.map(item => 
      columns.map(col => {
        const value = item[col] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    return [header, ...rows].join('\n');
  }

  static downloadCsv(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Inicializar dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardManager = new DashboardManager();

  // Event listeners adicionales
  document.addEventListener('visibilitychange', () => {
    if (window.dashboardManager) {
      window.dashboardManager.handleVisibilityChange();
    }
  });

  // Cleanup antes de cerrar/navegar
  window.addEventListener('beforeunload', () => {
    if (window.dashboardManager) {
      window.dashboardManager.destroy();
    }
  });

  // Exportar utilidades globalmente
  window.DashboardUtils = DashboardUtils;
});

// Funciones para botones de exportación
window.exportUsers = async () => {
  try {
    const response = await fetch('/api/dashboard/users?limit=1000');
    const data = await response.json();
    if (response.ok) {
      DashboardUtils.exportData('users', data.users);
      window.dashboardManager.showNotification('Usuarios exportados correctamente', 'success');
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    window.dashboardManager.showError('Error exportando usuarios: ' + error.message);
  }
};

window.exportLogs = async () => {
  try {
    const response = await fetch('/api/dashboard/logs?limit=1000');
    const data = await response.json();
    if (response.ok) {
      DashboardUtils.exportData('logs', data.logs);
      window.dashboardManager.showNotification('Logs exportados correctamente', 'success');
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    window.dashboardManager.showError('Error exportando logs: ' + error.message);
  }
};

window.exportAlerts = async () => {
  try {
    const response = await fetch('/api/dashboard/alerts');
    const data = await response.json();
    if (response.ok) {
      DashboardUtils.exportData('alerts', data.alerts);
      window.dashboardManager.showNotification('Alertas exportadas correctamente', 'success');
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    window.dashboardManager.showError('Error exportando alertas: ' + error.message);
  }
};