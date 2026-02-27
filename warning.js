const warningTimer = document.getElementById("warningTimer");

let remainingMs = 30 * 1000;
let intervalId = null;

const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const updateDisplay = () => {
  warningTimer.textContent = formatTime(remainingMs);
};

const startCountdown = () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  updateDisplay();
  intervalId = setInterval(() => {
    remainingMs -= 1000;
    updateDisplay();
    if (remainingMs <= 0) {
      clearInterval(intervalId);
    }
  }, 1000);
};

window.lockscreen.onWarningStart((data) => {
  if (data.remainingMs) {
    remainingMs = data.remainingMs;
  }
  startCountdown();
});

startCountdown();
