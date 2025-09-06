document.addEventListener('DOMContentLoaded', () => {
  const countdownElement = document.getElementById('countdown');
  const progressBar = document.getElementById('progress-bar');
  let secondsLeft = 10;

  const interval = setInterval(() => {
    secondsLeft--;
    countdownElement.textContent = secondsLeft;
    progressBar.style.width = `${(secondsLeft / 10) * 100}%`;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
      console.error("❌ Usuario no encontrado en localStorage");
      return;
    }
    if (secondsLeft <= 0) {
      clearInterval(interval);
      const params = new URLSearchParams(window.location.search);
      // 🔁 Llamado al backend para registrar el fallo
      fetch('/api/payments/paymentFail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          userId: user.id,
          status: 'failure',
          timestamp: new Date().toISOString(),
          paymentId: params.get("preference_id")
          // Puedes agregar más datos si los tienes: userId, preferenceId, etc.
        })
      })
      .then(response => {
        if (!response.ok) {
          console.error('❌ Error al registrar el fallo de pago');
        }
        // Redirigir después del llamado
        window.location.href = '/';
      })
      .catch(error => {
        console.error('❌ Error en fetch:', error);
        window.location.href = '/';
      });
    }
  }, 1000);
});
