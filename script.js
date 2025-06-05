let board;
let user = null;
let ai = null;
let currentPlayer = "X";

const clickSound = document.getElementById("click-sound");
const gameOverSound = document.getElementById("game-over-sound");
const aiClickSound =  document.getElementById("ai-click-sound");

function startGame(symbol) {
  user = symbol;
  ai = symbol === "X" ? "O" : "X";
  currentPlayer = "X";
  board = Array(3).fill(null).map(() => Array(3).fill(null));

  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "block";
  
  document.getElementById("play-again").style.display = "none";
  document.getElementById("home-button").style.display = "inline-block";

  drawBoard();

  if (currentPlayer !== user) setTimeout(aiMove, 300);
}

function playAgain() {
  board = Array(3).fill(null).map(() => Array(3).fill(null));
  currentPlayer = "X"; // always start with "X"

  document.getElementById("game").style.display = "block";
  document.getElementById("menu").style.display = "none";
  document.getElementById("play-again").style.display = "none";
  document.getElementById("home-button").style.display = "inline-block";

  drawBoard();

  // If AI is X, AI goes first
  if (currentPlayer === ai) {
    setTimeout(aiMove, 300);
  } else {
    updateStatus();
  }
}

function goHome() {
  document.getElementById("menu").style.display = "block";
  document.getElementById("game").style.display = "none";
  document.getElementById("play-again").style.display = "none";
  document.getElementById("home-button").style.display = "none";
}

function drawBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.innerText = board[i][j] || "";
      cell.onclick = () => handleMove(i, j);
      boardDiv.appendChild(cell);
    }
  }
  updateStatus();
}

function handleMove(i, j) {
  if (board[i][j] || currentPlayer !== user || checkWinner(board) || isFull(board)) return;
  board[i][j] = user;
  clickSound.play();
  currentPlayer = ai;
  drawBoard();
  setTimeout(aiMove, 300);
}


let aiIsThinking = false;
let dotsCount = 0;
let dotsInterval;

function startBlinkingDots() {
  const status = document.getElementById('status');
  dotsCount = 0;

  status.classList.add("thinking-effect");

  dotsInterval = setInterval(() => {
    dotsCount = (dotsCount + 1) % 4;
    status.innerText = "Computer is thinking" + ".".repeat(dotsCount);
  }, 500);
}

function stopBlinkingDots() {
  clearInterval(dotsInterval);
  const status = document.getElementById("status");
  status.classList.remove("thinking-effect");
}

function aiMove() {
  if (checkWinner(board) || isFull(board)) {
    aiIsThinking = false;
    stopBlinkingDots();
    updateStatus();
    return; // stop AI from playing if game ended
  }
  aiIsThinking = true;

  const status = document.getElementById('status');
  startBlinkingDots();

  requestAnimationFrame(() => {
    setTimeout(() => {
      const result = minimax(board, ai);

      if (result.move) {
        // Play sound a bit earlier
        setTimeout(() => {
          aiClickSound.play();
        }, 1000);  // Sound plays at 1000ms

        // Update move slightly after sound
        setTimeout(() => {
          board[result.move[0]][result.move[1]] = ai;
          drawBoard();

          aiIsThinking = false;
          stopBlinkingDots();
          currentPlayer = user;
          updateStatus();
          currentPlayer = user;
        }, 1500);  // Move shows at 1500ms 

      } else {
        aiIsThinking = false;
        stopBlinkingDots();
        updateStatus();
        currentPlayer = user;
      }
    }, 20);
  });
}

function isFull(boardToCheck) {
  if (!boardToCheck) return false;  // Prevent errors if undefined
  return boardToCheck.flat().every(cell => cell !== null);
}

function updateStatus() {
  if (aiIsThinking) {
    // While AI is thinking, do NOT overwrite status text
    return;
  }

  const winner = checkWinner(board);
  const status = document.getElementById("status");

  if (winner) {
    status.innerText = winner === ai ? "Computer won!" : "You won!";
    document.getElementById("play-again").style.display = "inline-block";
    gameOverSound.play();
  } else if (isFull(board)) {
    status.innerText = "It's a tie!";
    document.getElementById("play-again").style.display = "inline-block";
    gameOverSound.play();
  } else {
    status.innerText = currentPlayer === user ? "Your turn" : "Computer's turn";
  }
}



function checkWinner(boardToCheck) {
  const lines = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
  ];
  for (const line of lines) {
    const [a, b, c] = line;
    const valA = boardToCheck[a[0]][a[1]];
    const valB = boardToCheck[b[0]][b[1]];
    const valC = boardToCheck[c[0]][c[1]];
    if (valA && valA === valB && valA === valC) {
      return valA;
    }
  }
  return null;
}

function resetGame() {
  board = Array(3).fill(null).map(() => Array(3).fill(null));
  currentPlayer = "X";
  document.getElementById("menu").style.display = "block";  // <-- shows menu
  document.getElementById("game").style.display = "none";
}

// Minimax Algorithm
function minimax(state, player) {
  const winner = checkWinner(state);  // pass state here
  if (winner === ai) return { score: 1 };
  if (winner === user) return { score: -1 };
  if (isFull(state)) return { score: 0 };  // pass state here

  let moves = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (!state[i][j]) {
        state[i][j] = player;
        let result = minimax(state, player === ai ? user : ai);
        moves.push({ move: [i, j], score: result.score });
        state[i][j] = null;
      }
    }
  }

  if (player === ai) {
    return moves.reduce((best, move) => move.score > best.score ? move : best);
  } else {
    return moves.reduce((best, move) => move.score < best.score ? move : best);
  }
}

