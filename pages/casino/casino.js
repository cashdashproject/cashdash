const levelCount = 8;
const laneCount = 4;
const board = document.querySelector("#lane-board");
const statusMessage = document.querySelector("#game-status");
const levelCounter = document.querySelector("#level-counter");
const startButton = document.querySelector("#start-game");

let game = {
    level: -1,
    bombs: [],
    choices: [],
    finished: false
};

function renderBoard() {
    board.replaceChildren();

    for (let level = levelCount - 1; level >= 0; level -= 1) {
        for (let lane = 0; lane < laneCount; lane += 1) {
            const tile = document.createElement("button");
            const choice = game.choices[level];
            const isCurrentLevel = level === game.level;
            const isFinishedLevel = choice !== undefined;
            const isRevealedLevel = isFinishedLevel || (game.finished && isCurrentLevel);

            tile.type = "button";
            tile.className = "lane-tile";
            tile.dataset.level = String(level);
            tile.dataset.lane = String(lane);
            tile.setAttribute("aria-label", `Рівень ${level + 1}, доріжка ${lane + 1}`);

            if (isRevealedLevel && game.bombs[level] === lane) {
                tile.classList.add("is-bomb");
                tile.textContent = "✹";
                tile.setAttribute("aria-label", `Рівень ${level + 1}, доріжка ${lane + 1}: бомба`);
            } else if (isFinishedLevel && choice === lane) {
                tile.classList.add("is-safe");
                tile.textContent = "✓";
                tile.setAttribute("aria-label", `Рівень ${level + 1}, доріжка ${lane + 1}: безпечно`);
            } else if (isCurrentLevel && !game.finished) {
                tile.classList.add("is-selectable");
                tile.textContent = "＋";
            } else {
                tile.disabled = true;
                tile.textContent = level < game.level ? "·" : "";
                tile.classList.add(level < game.level ? "is-cleared" : "is-locked");
            }

            tile.disabled ||= !isCurrentLevel || game.finished;
            board.append(tile);
        }
    }
}

function startGame() {
    game = {
        level: 0,
        bombs: Array.from({ length: levelCount }, () => Math.floor(Math.random() * laneCount)),
        choices: [],
        finished: false
    };
    statusMessage.textContent = "Обери одну з чотирьох доріжок на першому рівні.";
    levelCounter.textContent = `0 / ${levelCount}`;
    startButton.textContent = "Почати заново";
    renderBoard();
}

function chooseLane(lane) {
    if (game.level < 0 || game.finished) return;

    if (game.bombs[game.level] === lane) {
        game.finished = true;
        statusMessage.textContent = `Бомба! Ти дійшов до рівня ${game.level + 1}. Спробуй ще раз.`;
    } else {
        game.choices[game.level] = lane;
        game.level += 1;

        if (game.level === levelCount) {
            game.finished = true;
            statusMessage.textContent = "Фініш! Ти пройшов усі рівні CashDash.";
        } else {
            statusMessage.textContent = `Безпечно! Обери доріжку на рівні ${game.level + 1}.`;
        }
    }

    levelCounter.textContent = `${game.choices.length} / ${levelCount}`;
    renderBoard();
}

startButton.addEventListener("click", startGame);
board.addEventListener("click", (event) => {
    const tile = event.target.closest(".lane-tile.is-selectable");
    if (tile) chooseLane(Number(tile.dataset.lane));
});

renderBoard();

const slotColumns = 5;
const slotRows = 3;
const slotSymbols = [
    { icon: "🍋", name: "Лимон", value: 2, weight: 228 },
    { icon: "🍒", name: "Вишні", value: 2, weight: 228 },
    { icon: "🍀", name: "Конюшина", value: 3, weight: 175 },
    { icon: "💎", name: "Діамант", value: 5, weight: 140 },
    { icon: "", name: "Скриня", value: 5, weight: 140 },
    { icon: "7", name: "Сімка", value: 7, weight: 88 }
];
const slotBoard = document.querySelector("#slot-reels");
const slotCells = [];
const slotCredits = document.querySelector("#slot-credits");
const slotBet = document.querySelector("#slot-bet");
const slotResult = document.querySelector("#slot-result");
const spinButton = document.querySelector("#spin-slots");
let credits = 500;
let bet = 10;
let spinning = false;
let currentBoard = [];

function renderSlotBoard(highlighted = new Set()) {
    slotBoard.replaceChildren();
    slotCells.length = 0;

    currentBoard.forEach((symbol, index) => {
        const cell = document.createElement("span");
        cell.className = "slot-cell";
        if (symbol.name === "Сімка") cell.classList.add("is-seven");
        if (symbol.name === "Скриня") cell.classList.add("is-chest");
        else cell.textContent = symbol.icon;
        cell.setAttribute("aria-label", symbol.name);
        if (highlighted.has(index)) cell.classList.add("is-winning");
        slotBoard.append(cell);
        slotCells.push(cell);
    });
}

function randomSymbol() {
    const target = Math.random() * 999;
    let cumulativeWeight = 0;

    for (const symbol of slotSymbols) {
        cumulativeWeight += symbol.weight;
        if (target < cumulativeWeight) return symbol;
    }

    return slotSymbols[slotSymbols.length - 1];
}

function evaluateSlotBoard(symbols) {
    const wins = [];
    const winningCells = new Set();
    let jackpot = false;

    function addCombination(indices, multiplier, name) {
        const firstSymbol = symbols[indices[0]];
        if (!indices.every((index) => symbols[index] === firstSymbol)) return;

        wins.push({
            name,
            payout: firstSymbol.value * bet * multiplier,
            indices
        });
        indices.forEach((index) => winningCells.add(index));
    }

    for (let row = 0; row < slotRows; row += 1) {
        const rowIndices = Array.from({ length: slotColumns }, (_, column) => row * slotColumns + column);
        if (rowIndices.every((index) => symbols[index] === symbols[rowIndices[0]])) {
            const rowMultiplier = row === 1 ? 8 : 7;
            addCombination(rowIndices, rowMultiplier, row === 1 ? "середній ряд ×8" : "верхній / нижній ряд ×7");
        } else {
            for (let column = 0; column <= slotColumns - 4; column += 1) {
                addCombination([0, 1, 2, 3].map((offset) => row * slotColumns + column + offset), 2, "горизонталь ×2");
            }
            for (let column = 0; column <= slotColumns - 3; column += 1) {
                addCombination([0, 1, 2].map((offset) => row * slotColumns + column + offset), 1, "горизонталь ×1");
            }
        }
    }

    for (let column = 0; column < slotColumns; column += 1) {
        addCombination([column, slotColumns + column, slotRows * slotColumns - slotColumns + column], 1, "вертикаль ×1");
    }

    for (let row = 0; row <= slotRows - 3; row += 1) {
        for (let column = 0; column <= slotColumns - 3; column += 1) {
            addCombination([0, 1, 2].map((offset) => (row + offset) * slotColumns + column + offset), 1, "діагональ ×1");
            addCombination([0, 1, 2].map((offset) => (row + 2 - offset) * slotColumns + column + offset), 1, "діагональ ×1");
        }
    }

    for (let column = 0; column <= slotColumns - 4; column += 1) {
        const rising = [2, 1, 0, 1].map((row, offset) => row * slotColumns + column + offset);
        const falling = [0, 1, 2, 1].map((row, offset) => row * slotColumns + column + offset);
        addCombination(rising, 4, "вгору ×4");
        addCombination(falling, 4, "вниз ×4");
    }

    if (symbols.every((symbol) => symbol === symbols[0])) {
        wins.length = 0;
        winningCells.clear();
        addCombination(Array.from({ length: slotColumns * slotRows }, (_, index) => index), 10, "джекпот ×10");
        jackpot = true;
    }

    return { wins, winningCells, payout: wins.reduce((total, win) => total + win.payout, 0), jackpot };
}

function updateSlots() {
    slotCredits.textContent = credits.toLocaleString("uk-UA");
    slotBet.textContent = String(bet);
    document.querySelector("#bet-down").disabled = spinning || bet <= 10;
    document.querySelector("#bet-up").disabled = spinning || bet >= 100 || bet + 10 > credits;
    spinButton.disabled = spinning || credits < bet;
    document.querySelector("#reset-slots").disabled = spinning;
}

function spinSlots() {
    if (spinning || credits < bet) return;

    spinning = true;
    credits -= bet;
    slotResult.textContent = "Барабани крутяться…";
    document.querySelector("#jackpot-celebration").classList.remove("is-active");
    slotBoard.classList.add("is-spinning");
    updateSlots();

    const animation = window.setInterval(() => {
        currentBoard = Array.from({ length: slotColumns * slotRows }, randomSymbol);
        renderSlotBoard();
    }, 90);

    window.setTimeout(() => {
        window.clearInterval(animation);
        currentBoard = Array.from({ length: slotColumns * slotRows }, randomSymbol);
        const result = evaluateSlotBoard(currentBoard);
        slotBoard.classList.remove("is-spinning");
        renderSlotBoard(result.winningCells);
        credits += result.payout;
        spinning = false;

        if (result.wins.length) {
            const combinationNames = [...new Set(result.wins.map((win) => win.name))].join(", ");
            slotResult.textContent = `Виграш ${result.payout} кредитів · ${combinationNames}`;
        } else {
            slotResult.textContent = "Комбінацій немає. Спробуй ще раз.";
        }

        if (result.jackpot) {
            const celebration = document.querySelector("#jackpot-celebration");
            celebration.classList.add("is-active");
            window.setTimeout(() => celebration.classList.remove("is-active"), 3200);
        }

        updateSlots();
    }, 900);
}

document.querySelector("#bet-down").addEventListener("click", () => {
    bet = Math.max(10, bet - 10);
    updateSlots();
});

document.querySelector("#bet-up").addEventListener("click", () => {
    bet = Math.min(100, credits, bet + 10);
    updateSlots();
});

document.querySelector("#reset-slots").addEventListener("click", () => {
    credits = 500;
    bet = 10;
    document.querySelector("#jackpot-celebration").classList.remove("is-active");
    slotResult.textContent = "Натисни «Крутити», щоб почати.";
    currentBoard = Array.from({ length: slotColumns * slotRows }, (_, index) => slotSymbols[(index + 2) % slotSymbols.length]);
    renderSlotBoard();
    updateSlots();
});

currentBoard = Array.from({ length: slotColumns * slotRows }, (_, index) => slotSymbols[(index + 2) % slotSymbols.length]);
renderSlotBoard();
spinButton.addEventListener("click", spinSlots);
updateSlots();