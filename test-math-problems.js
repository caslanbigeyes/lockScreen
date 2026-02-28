// test-math-problems.js - 测试数学题生成和验证逻辑

console.log('╔════════════════════════════════════════════╗');
console.log('║   数学题生成和验证测试                     ║');
console.log('╚════════════════════════════════════════════╝\n');

// 模拟 randomProblem 函数
const randomProblem = (level) => {
  let a, b, op, ans, display;

  switch (level) {
    case 1: // 两位数加减
      a = 45;
      b = 23;
      op = "+";
      ans = op === "+" ? a + b : a - b;
      display = `${a} ${op} ${b}`;
      break;
    case 2: // 两位数乘法
      a = 12;
      b = 5;
      op = "*";
      ans = a * b;
      display = `${a} × ${b}`;
      break;
    case 3: // 三位数加减
      a = 456;
      b = 234;
      op = "+";
      ans = op === "+" ? a + b : a - b;
      display = `${a} ${op} ${b}`;
      break;
    case 4: // 简单平方
      a = 12;
      ans = a * a;
      display = `${a}²`;
      break;
  }

  return { display, ans, level };
};

// 测试每个难度级别
for (let level = 1; level <= 4; level++) {
  console.log(`\n测试 Level ${level}:`);
  const problem = randomProblem(level);
  
  console.log(`题目: ${problem.display}`);
  console.log(`答案: ${problem.ans} (类型: ${typeof problem.ans})`);
  
  // 模拟用户输入
  const userInput = String(problem.ans);
  const userAnswer = Number(userInput);
  
  console.log(`用户输入: "${userInput}"`);
  console.log(`转换后: ${userAnswer} (类型: ${typeof userAnswer})`);
  
  // 验证
  const pass = userAnswer === problem.ans;
  console.log(`验证结果: ${pass ? '✅ 通过' : '❌ 失败'}`);
  
  if (!pass) {
    console.log(`  期望: ${problem.ans}`);
    console.log(`  实际: ${userAnswer}`);
    console.log(`  相等: ${userAnswer === problem.ans}`);
    console.log(`  严格相等: ${userAnswer === problem.ans}`);
  }
}

// 测试边界情况
console.log('\n\n测试边界情况:');

const testCases = [
  { input: '0', expected: 0, desc: '零' },
  { input: '100', expected: 100, desc: '整百' },
  { input: '999', expected: 999, desc: '三位数' },
  { input: '-50', expected: -50, desc: '负数' },
  { input: '  123  ', expected: 123, desc: '带空格' },
  { input: '123.0', expected: 123, desc: '小数点零' },
];

testCases.forEach(test => {
  const userAnswer = Number(test.input);
  const pass = userAnswer === test.expected;
  console.log(`\n${test.desc}:`);
  console.log(`  输入: "${test.input}"`);
  console.log(`  转换: ${userAnswer}`);
  console.log(`  期望: ${test.expected}`);
  console.log(`  结果: ${pass ? '✅' : '❌'}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n测试完成！');
