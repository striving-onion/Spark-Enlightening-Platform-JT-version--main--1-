let aiNumber = Math.floor(Math.random() * 100) + 1;
let tip = document.getElementById('tip');

function guess() {
let input = document.getElementById('guessInput');
let userGuess = Number(input.value);

if (!Number.isInteger(userGuess) || userGuess < 1 || userGuess > 100) {
tip.textContent = "请输入 1~100 之间的数字！";
tip.className = "tip lose";
return;
}

if (userGuess === aiNumber) {
tip.textContent = "🎉 恭喜你猜对了！AI都佩服你！";
tip.className = "tip win";
} else if (userGuess > aiNumber) {
tip.textContent = "⬇️ 数字太大了，再小一点！";
tip.className = "tip lose";
} else {
tip.textContent = "⬆️ 数字太小了，再大一点！";
tip.className = "tip lose";
}
}

// 新增：重开一局（原来猜中后只能刷新页面）
function resetGame() {
aiNumber = Math.floor(Math.random() * 100) + 1;
tip.textContent = "";
tip.className = "tip";
var input = document.getElementById('guessInput');
input.value = "";
input.focus();
}

// 新增：支持回车提交
document.getElementById('guessInput').addEventListener('keydown', function (e) {
if (e.key === 'Enter') guess();
});
