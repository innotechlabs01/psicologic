document.addEventListener('DOMContentLoaded', () => {
  const countdownElement = document.getElementById('countdown');
  const progressBar = document.getElementById('progress-bar');
  let secondsLeft = 10;

  const interval = setInterval(() => {
    secondsLeft--;
    countdownElement.textContent = secondsLeft;
    progressBar.style.width = `${(secondsLeft / 10) * 100}%`;

    if (secondsLeft <= 0) {
      clearInterval(interval);
      // Redirigir después del llamado
      window.location.href = '/';
    }
  }, 1000);
});
