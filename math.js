const problemEl = document.getElementById("problem");
const answerEl = document.getElementById("answer");
const submitBtn = document.getElementById("submit");
const countdownEl = document.getElementById("countdown");
const levelBadge = document.getElementById("levelBadge");
const resultEl = document.getElementById("result");

let current = null;
let remainingSeconds = 20;
let countdownInterval = null;

const updateCountdown = () => {
  countdownEl.textContent = `剩余时间：${remainingSeconds} 秒`;
  if (remainingSeconds <= 5) {
    countdownEl.classList.add("warn");
  }
};

const startCountdown = () => {
  remainingSeconds = 20;
  updateCountdown();
  countdownInterval = setInterval(() => {
    remainingSeconds--;
    updateCountdown();
    if (remainingSeconds <= 0) {
      clearInterval(countdownInterval);
      countdownEl.textContent = "时间到！";
      // 超时由主进程处理（mathCountdownTimer）
    }
  }, 1000);
};

window.gate.onProblem((p) => {
  current = p;
  problemEl.textContent = `${p.display} = ?`;
  levelBadge.textContent = `Level ${p.level || 1}`;
  answerEl.value = "";
  answerEl.focus();
  resultEl.style.display = "none";
  startCountdown();
});

submitBtn.addEventListener("click", () => {
  const v = Number(answerEl.value);
  window.gate.submitAnswer({ answer: v });
});

answerEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const v = Number(answerEl.value);
    window.gate.submitAnswer({ answer: v });
  }
});
