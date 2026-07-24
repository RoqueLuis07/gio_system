import { state } from '../state.js';

export function updateClockAndGreeting() {
  const now = new Date();
  const hrs = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('live-clock').textContent = `${hrs}:${mins}:${secs}`;

  let greeting = '¡Buenas noches!';
  if (hrs >= 5 && hrs < 12) greeting = '¡Buenos días!';
  else if (hrs >= 12 && hrs < 19) greeting = '¡Buenas tardes!';

  document.getElementById('welcome-greeting').textContent = `${greeting} ${state.usuario.nombre}`;
}

export function initClock() {
  updateClockAndGreeting();
  setInterval(updateClockAndGreeting, 1000);
}
