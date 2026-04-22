/**
 * ARCHIVO DE DEBUG MEJORADO - Diagnóstico de Citas
 * 
 * Copia TODO este código en la consola del navegador (F12) y ejecuta
 */

console.clear();
console.log('%c╔═══════════════════════════════════════════╗', 'color: #00ff88; font-weight: bold;');
console.log('%c║  DIAGNÓSTICO DE CITAS - Debug Mejorado   ║', 'color: #00ff88; font-weight: bold;');
console.log('%c╚═══════════════════════════════════════════╝', 'color: #00ff88; font-weight: bold;');

// ============================================================================
// TEST 1: Información de Sistema
// ============================================================================
console.log('\n%c✓ TEST 1: Información de Sistema', 'color: #00ff88; font-size: 12px; font-weight: bold;');
console.log('Fecha hoy:', new Date().toLocaleDateString('es-ES', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
}));
console.log('URL actual:', window.location.href);
console.log('¿Estás en /client?', window.location.href.includes('/client'));

// ============================================================================
// TEST 2: Verificar Autenticación
// ============================================================================
console.log('\n%c✓ TEST 2: Verificación de Autenticación', 'color: #00ff88; font-size: 12px; font-weight: bold;');

// Buscar en cookies
const cookies = document.cookie.split(';');
const hasClerkSession = cookies.some(c => c.includes('__session') || c.includes('clerk'));
console.log('¿Sesión activa?', hasClerkSession ? '✅ SÍ' : '❌ NO');
console.log('Cookies:', cookies.length);

if (!hasClerkSession) {
  console.warn('%c⚠️  No hay sesión de Clerk. Asegúrate de estar logueado.', 'color: orange; font-weight: bold;');
}

// ============================================================================
// TEST 3: Llamar al API Correctamente
// ============================================================================
console.log('\n%c✓ TEST 3: Llamar al API', 'color: #00ff88; font-size: 12px; font-weight: bold;');

const testAPIFixed = async () => {
  // Calcular rango: última semana
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const startDate = sevenDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  
  console.log('📅 Rango:', startDate, '→', endDate);
  
  // ★ IMPORTANTE: NO enviar userId en la query
  // El userId viene del servidor (Clerk session)
  const url = `/api/appointments/history?startDate=${startDate}&endDate=${endDate}`;
  
  console.log('🔗 URL:', url);
  console.log('\n📡 Enviando fetch...');
  
  try {
    const response = await fetch(url);
    
    console.log('📊 Status:', response.status, response.statusText);
    
    // Mostrar headers
    console.log('Headers:');
    console.log('  Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      console.error('%c✗ Error HTTP', 'color: red; font-weight: bold;');
      const bodyText = await response.text();
      console.error('Body:', bodyText);
      
      try {
        const errorJson = JSON.parse(bodyText);
        console.error('Error JSON:', errorJson);
      } catch (e) {
        // No es JSON
      }
      return;
    }

    const data = await response.json();
    console.log('%c✓ Respuesta OK', 'color: green; font-weight: bold;');
    console.log('Cantidad de citas:', data.length);
    
    if (data.length === 0) {
      console.warn('%c⚠️  No hay citas en este rango', 'color: orange;');
    } else {
      console.table(data.map(apt => ({
        fecha: apt.date,
        hora: apt.startTime,
        titulo: apt.title,
        estado: apt.status,
        id: apt.id
      })));
    }
    
    // Estadísticas
    const pending = data.filter(apt => apt.status === 'pending');
    const confirmed = data.filter(apt => apt.status === 'confirmed');
    
    console.log('\n%c📊 Estadísticas:', 'color: blue; font-weight: bold;');
    console.log('Pendientes:', pending.length);
    console.log('Confirmadas:', confirmed.length);
    console.log('Total:', data.length);
    
    return data;
  } catch (error) {
    console.error('%c✗ Error en fetch:', 'color: red; font-weight: bold;', error);
    return null;
  }
};

// Ejecutar
console.log('\n🚀 Ejecutando test API...\n');
testAPIFixed();

console.log('\n%c═══════════════════════════════════════════', 'color: #00ff88;');
console.log('%c¿Qué hacer si algo falla?', 'color: #ffaa00; font-weight: bold;');
console.log('%c═══════════════════════════════════════════', 'color: #00ff88;');
console.log(`
1️⃣  Si ves "No hay citas en este rango"
    → Probablemente la cita está en otra fecha
    → Cambía las fechas en el código arriba
    
2️⃣  Si ves error 401 "Unauthorized"
    → No estás logueado
    → Recarga la página e intenta de nuevo
    
3️⃣  Si ves error 500 "Internal Server Error"  
    → Error en el servidor
    → Revisa los logs del servidor (terminal)
    
4️⃣  Si ves SyntaxError
    → Respuesta no es JSON válido
    → Error en el servidor también
    
5️⃣  Si ves error de CORS
    → Problema de configuración del servidor
    → Reinicia el servidor con: pnpm dev
`);

console.log('%c═══════════════════════════════════════════', 'color: #00ff88;');
