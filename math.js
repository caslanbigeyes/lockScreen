const problemEl = document.getElementById("problem");
const answerEl = document.getElementById("answer");
const submitBtn = document.getElementById("submit");

let current = null;

window.gate.onProblem((p) => {
  current = p;
  problemEl.textContent = `${p.a} ${p.op} ${p.b} = ?`;
  answerEl.value = "";
  answerEl.focus();
});

submitBtn.addEventListener("click", () => {
  const v = Number(answerEl.value);
  window.gate.submitAnswer({ answer: v });
});
