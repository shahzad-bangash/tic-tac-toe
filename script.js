/**
 * TICTACTOE - MODERN AI GAME ENGINE
 * Unbeatable Recursive Minimax Decision Tree Algorithm,
 * Particle Constellation Background, Persistent Score Tracking,
 * Web Audio API Sound Synthesizer, and Fluid Glassmorphism UI.
 */

(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     1. State Management
     -------------------------------------------------------------------------- */
  let board = Array(3).fill(null).map(() => Array(3).fill(null));
  let user = "X";
  let ai = "O";
  let currentPlayer = "X";
  let gameActive = false;
  let aiIsThinking = false;
  let soundMuted = false;
  let difficulty = "hard"; // 'easy' or 'hard'
  let gameMode = "ai"; // 'ai' or 'pvp'

  const scores = {
    player: 0,
    ai: 0,
    ties: 0
  };

  // Load scores from localStorage if available
  try {
    const saved = localStorage.getItem("tictactoe_scores");
    if (saved) {
      Object.assign(scores, JSON.parse(saved));
    }
  } catch (e) {
    console.warn("Storage unavailable", e);
  }

  // Load sound preference if saved
  try {
    const savedSound = localStorage.getItem("tictactoe_sound_muted");
    if (savedSound !== null) {
      soundMuted = savedSound === "true";
    }
  } catch (e) {}

  // Load mode & difficulty preferences if saved
  try {
    const savedMode = localStorage.getItem("tictactoe_mode");
    if (savedMode === "ai" || savedMode === "pvp") {
      gameMode = savedMode;
    }
    const savedDiff = localStorage.getItem("tictactoe_difficulty");
    if (savedDiff === "easy" || savedDiff === "hard") {
      difficulty = savedDiff;
    }
  } catch (e) {}

  window.setGameMode = function (mode) {
    gameMode = mode;
    try {
      localStorage.setItem("tictactoe_mode", mode);
    } catch (e) {}

    const aiBtn = document.getElementById("modeAiBtn");
    const pvpBtn = document.getElementById("modePvpBtn");
    const diffSection = document.getElementById("difficultySection");
    const badgeText = document.getElementById("badgeDifficultyText");
    const subtitle = document.getElementById("gameSubtitle");
    const scoreLabel1 = document.getElementById("score-label-1");
    const scoreLabel2 = document.getElementById("score-label-2");
    const selectLabel = document.getElementById("selectLabel");
    const descX = document.getElementById("descX");
    const descO = document.getElementById("descO");

    if (mode === "pvp") {
      if (aiBtn) aiBtn.classList.remove("active");
      if (pvpBtn) pvpBtn.classList.add("active");
      if (diffSection) diffSection.style.display = "none";
      if (badgeText) badgeText.innerHTML = "Local &bull; 2 Players";
      if (subtitle) subtitle.innerText = "Local Pass & Play Game";
      if (scoreLabel1) scoreLabel1.innerText = "Player X";
      if (scoreLabel2) scoreLabel2.innerText = "Player O";
      if (selectLabel) selectLabel.innerText = "Choose who starts first:";
      if (descX) descX.innerHTML = 'Player X First <i class="bx bx-user"></i>';
      if (descO) descO.innerHTML = 'Player O First <i class="bx bx-user-voice"></i>';
    } else {
      if (aiBtn) aiBtn.classList.add("active");
      if (pvpBtn) pvpBtn.classList.remove("active");
      if (diffSection) diffSection.style.display = "flex";
      if (scoreLabel1) scoreLabel1.innerText = "Player";
      if (scoreLabel2) scoreLabel2.innerText = "AI";
      if (selectLabel) selectLabel.innerText = "Choose your side to begin:";
      if (descX) descX.innerHTML = 'You First <i class="bx bx-user"></i>';
      if (descO) descO.innerHTML = 'AI First <i class="bx bx-chip"></i>';
      setDifficulty(difficulty);
    }
  };

  window.setDifficulty = function (level) {
    difficulty = level;
    try {
      localStorage.setItem("tictactoe_difficulty", level);
    } catch (e) {}

    if (gameMode !== "ai") return;

    const easyBtn = document.getElementById("diffEasyBtn");
    const hardBtn = document.getElementById("diffHardBtn");
    const badgeText = document.getElementById("badgeDifficultyText");
    const subtitle = document.getElementById("gameSubtitle");

    if (easyBtn && hardBtn) {
      if (level === "easy") {
        easyBtn.classList.add("active");
        hardBtn.classList.remove("active");
        if (badgeText) badgeText.innerHTML = "Casual &bull; Easy";
        if (subtitle) subtitle.innerText = "Casual AI with Occasional Mistakes";
      } else {
        hardBtn.classList.add("active");
        easyBtn.classList.remove("active");
        if (badgeText) badgeText.innerHTML = "Minimax &bull; Hard";
        if (subtitle) subtitle.innerText = "Recursive Minimax Decision Tree Engine";
      }
    }
  };

  /* Audio Elements & Audio Synthesis */
  const clickSound = document.getElementById("click-sound");
  const aiClickSound = document.getElementById("ai-click-sound");
  const gameOverSound = document.getElementById("game-over-sound");
  const soundToggleBtn = document.getElementById("soundToggleBtn");
  const soundIcon = document.getElementById("soundIcon");

  // Web Audio Context for distinct, crisp win/loss sound effects
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, delay = 0, gainVal = 0.15) {
    if (soundMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {}
  }

  // Triumphant rising arpeggio for User Win (C5 -> E5 -> G5 -> C6)
  function playVictorySound() {
    if (soundMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      playTone(freq, "triangle", 0.28, idx * 0.1, 0.22);
    });
  }

  // Somber descending low tone for AI Win (Defeat)
  function playDefeatSound() {
    if (soundMuted) return;
    const notes = [329.63, 293.66, 261.63, 196.00]; // E4, D4, C4, G3
    notes.forEach((freq, idx) => {
      playTone(freq, "sawtooth", 0.35, idx * 0.13, 0.14);
    });
  }

  // Soft neutral harmonic chord for Tie / Draw
  function playTieSound() {
    if (soundMuted) return;
    playTone(440, "sine", 0.3, 0, 0.15);     // A4
    playTone(554.37, "sine", 0.3, 0.1, 0.15); // C#5
    playTone(659.25, "sine", 0.4, 0.2, 0.15); // E5
  }

  function playAudio(audio) {
    if (soundMuted || !audio) return;
    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (e) {}
  }

  function updateSoundUI() {
    if (!soundToggleBtn || !soundIcon) return;
    if (soundMuted) {
      soundToggleBtn.classList.add("muted");
      soundIcon.className = "bx bx-volume-mute";
    } else {
      soundToggleBtn.classList.remove("muted");
      soundIcon.className = "bx bx-volume-full";
    }
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener("click", () => {
      soundMuted = !soundMuted;
      try {
        localStorage.setItem("tictactoe_sound_muted", soundMuted);
      } catch (e) {}
      updateSoundUI();
    });
  }

  /* --------------------------------------------------------------------------
     2. Scoreboard & UI Helpers
     -------------------------------------------------------------------------- */
  function updateScoreDisplay() {
    const pEl = document.getElementById("score-player");
    const tEl = document.getElementById("score-ties");
    const aEl = document.getElementById("score-ai");
    if (pEl) pEl.innerText = scores.player;
    if (tEl) tEl.innerText = scores.ties;
    if (aEl) aEl.innerText = scores.ai;
    try {
      localStorage.setItem("tictactoe_scores", JSON.stringify(scores));
    } catch (e) {}
  }

  window.resetScores = function () {
    scores.player = 0;
    scores.ai = 0;
    scores.ties = 0;
    updateScoreDisplay();
  };

  /* --------------------------------------------------------------------------
     3. Game Flow Control
     -------------------------------------------------------------------------- */
  window.startGame = function (symbol) {
    user = symbol;
    ai = symbol === "X" ? "O" : "X";
    currentPlayer = symbol; // The chosen symbol starts first
    board = Array(3).fill(null).map(() => Array(3).fill(null));
    gameActive = true;
    aiIsThinking = false;

    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("play-again").style.display = "none";

    drawBoard();

    if (gameMode === "ai") {
      if (currentPlayer === ai) {
        triggerAiMove();
      } else {
        setStatus("Your turn (" + user + ")", "user");
      }
    } else {
      // 2-Player mode
      setStatus("Player " + currentPlayer + "'s turn", "user");
    }
  };

  window.playAgain = function () {
    board = Array(3).fill(null).map(() => Array(3).fill(null));
    currentPlayer = "X";
    gameActive = true;
    aiIsThinking = false;

    document.getElementById("play-again").style.display = "none";
    drawBoard();

    if (gameMode === "ai") {
      if (currentPlayer === ai) {
        triggerAiMove();
      } else {
        setStatus("Your turn (" + user + ")", "user");
      }
    } else {
      setStatus("Player " + currentPlayer + "'s turn", "user");
    }
  };

  window.goHome = function () {
    gameActive = false;
    aiIsThinking = false;
    document.getElementById("menu").style.display = "block";
    document.getElementById("game").style.display = "none";
    updateScoreDisplay();
  };

  /* --------------------------------------------------------------------------
     4. Board Rendering & Interaction
     -------------------------------------------------------------------------- */
  function drawBoard() {
    const boardDiv = document.getElementById("board");
    if (!boardDiv) return;
    boardDiv.innerHTML = "";

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const cell = document.createElement("button");
        cell.className = "cell";
        cell.setAttribute("type", "button");
        cell.setAttribute("aria-label", `Cell row ${i + 1}, column ${j + 1}`);
        cell.dataset.row = i;
        cell.dataset.col = j;

        const val = board[i][j];
        if (val) {
          const mark = document.createElement("span");
          mark.className = "cell-mark";
          mark.innerText = val;
          cell.appendChild(mark);
          cell.classList.add("occupied");
          cell.classList.add(val === "X" ? "cell-x" : "cell-o");
        }

        cell.onclick = () => handleMove(i, j);
        boardDiv.appendChild(cell);
      }
    }
  }

  function handleMove(i, j) {
    if (!gameActive || board[i][j] || aiIsThinking) return;

    if (gameMode === "ai") {
      if (currentPlayer !== user) return;
      board[i][j] = user;
      playAudio(clickSound);
      drawBoard();

      const winData = checkWinnerData(board);
      if (winData) {
        endGame(winData.winner, winData.line);
        return;
      }

      if (isFull(board)) {
        endGame(null);
        return;
      }

      currentPlayer = ai;
      triggerAiMove();
    } else {
      // 2 Players Local Mode
      board[i][j] = currentPlayer;
      playAudio(clickSound);
      drawBoard();

      const winData = checkWinnerData(board);
      if (winData) {
        endGame(winData.winner, winData.line);
        return;
      }

      if (isFull(board)) {
        endGame(null);
        return;
      }

      // Switch turn
      currentPlayer = currentPlayer === "X" ? "O" : "X";
      setStatus("Player " + currentPlayer + "'s turn", "user");
    }
  }

  function getAvailableMoves(b) {
    const moves = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (!b[i][j]) moves.push([i, j]);
      }
    }
    return moves;
  }

  function getAiMove() {
    if (difficulty === "easy") {
      const openMoves = getAvailableMoves(board);
      if (openMoves.length === 0) return null;

      // 1. If AI can win right now, take it 70% of the time
      for (const [r, c] of openMoves) {
        board[r][c] = ai;
        const win = checkWinner(board);
        board[r][c] = null;
        if (win === ai && Math.random() < 0.7) {
          return [r, c];
        }
      }

      // 2. 60% chance to pick a purely random move (making it beatable & human-like)
      if (Math.random() < 0.6) {
        return openMoves[Math.floor(Math.random() * openMoves.length)];
      }

      // 3. Otherwise fall back to minimax
      const smartResult = minimax(board, ai);
      return smartResult ? smartResult.move : openMoves[0];
    }

    // Hard Mode: 100% Unbeatable Minimax
    const result = minimax(board, ai);
    return result ? result.move : null;
  }

  function triggerAiMove() {
    aiIsThinking = true;
    setStatus(difficulty === "easy" ? "AI is playing..." : "AI is calculating optimal move...", "thinking");

    setTimeout(() => {
      if (!gameActive) return;

      const move = getAiMove();
      if (move) {
        board[move[0]][move[1]] = ai;
        playAudio(aiClickSound);
        drawBoard();

        const winData = checkWinnerData(board);
        if (winData) {
          endGame(winData.winner, winData.line);
          return;
        }

        if (isFull(board)) {
          endGame(null);
          return;
        }

        currentPlayer = user;
        aiIsThinking = false;
        setStatus("Your turn (" + user + ")", "user");
      }
    }, difficulty === "easy" ? 350 : 450);
  }

  function setStatus(text, state) {
    const statusBar = document.getElementById("status");
    const statusText = document.getElementById("status-text");
    const spinner = document.getElementById("thinking-spinner");

    if (!statusBar || !statusText) return;

    statusBar.className = "status-bar";
    statusText.innerText = text;

    if (state === "thinking") {
      statusBar.classList.add("thinking");
      if (spinner) spinner.style.display = "inline-block";
    } else {
      if (spinner) spinner.style.display = "none";
      if (state === "user-win") statusBar.classList.add("winner-user");
      if (state === "ai-win") statusBar.classList.add("winner-ai");
      if (state === "tie") statusBar.classList.add("tie");
    }
  }

  function endGame(winner, winLine) {
    gameActive = false;
    aiIsThinking = false;

    const playAgainBtn = document.getElementById("play-again");
    if (playAgainBtn) playAgainBtn.style.display = "inline-flex";

    if (winner) {
      if (gameMode === "ai") {
        const isUserWin = winner === user;
        if (isUserWin) {
          scores.player++;
          setStatus("Victory! You won the game!", "user-win");
          playVictorySound();
        } else {
          scores.ai++;
          setStatus("AI Won! Unbeatable Minimax strikes!", "ai-win");
          playDefeatSound();
        }
        if (winLine) {
          highlightWinLine(winLine, !isUserWin);
        }
      } else {
        // 2-Player mode: Play victory celebration for whichever player won
        playVictorySound();
        if (winner === "X") {
          scores.player++;
          setStatus("Player X Wins!", "user-win");
          if (winLine) highlightWinLine(winLine, false);
        } else {
          scores.ai++;
          setStatus("Player O Wins!", "ai-win");
          if (winLine) highlightWinLine(winLine, true);
        }
      }
    } else {
      scores.ties++;
      setStatus("Game Draw! Well played!", "tie");
      playTieSound();
    }

    updateScoreDisplay();
  }

  function highlightWinLine(line, isAi) {
    const boardDiv = document.getElementById("board");
    if (!boardDiv) return;
    const cells = boardDiv.querySelectorAll(".cell");

    line.forEach(([r, c]) => {
      const index = r * 3 + c;
      if (cells[index]) {
        cells[index].classList.add("winning-cell");
        if (isAi) cells[index].classList.add("cell-ai-win");
      }
    });
  }

  /* --------------------------------------------------------------------------
     5. Minimax Engine (Decision Tree Algorithm)
     -------------------------------------------------------------------------- */
  function isFull(b) {
    return b.every(row => row.every(c => c !== null));
  }

  const WIN_COMBOS = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
  ];

  function checkWinnerData(b) {
    for (let i = 0; i < WIN_COMBOS.length; i++) {
      const line = WIN_COMBOS[i];
      const [r1, c1] = line[0];
      const [r2, c2] = line[1];
      const [r3, c3] = line[2];
      if (b[r1][c1] && b[r1][c1] === b[r2][c2] && b[r1][c1] === b[r3][c3]) {
        return { winner: b[r1][c1], line: line };
      }
    }
    return null;
  }

  function checkWinner(b) {
    const res = checkWinnerData(b);
    return res ? res.winner : null;
  }

  function minimax(state, player, depth = 0) {
    const winner = checkWinner(state);
    if (winner === ai) return { score: 10 - depth };
    if (winner === user) return { score: depth - 10 };
    if (isFull(state)) return { score: 0 };

    let moves = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (!state[i][j]) {
          state[i][j] = player;
          const result = minimax(state, player === ai ? user : ai, depth + 1);
          moves.push({ move: [i, j], score: result.score });
          state[i][j] = null;
        }
      }
    }

    if (player === ai) {
      let maxScore = -Infinity;
      let bestMove = moves[0];
      for (let m of moves) {
        if (m.score > maxScore) {
          maxScore = m.score;
          bestMove = m;
        }
      }
      return bestMove;
    } else {
      let minScore = Infinity;
      let bestMove = moves[0];
      for (let m of moves) {
        if (m.score < minScore) {
          minScore = m.score;
          bestMove = m;
        }
      }
      return bestMove;
    }
  }

  /* --------------------------------------------------------------------------
     6. Dynamic Particle Constellation Background (Exact Portfolio Theme)
     -------------------------------------------------------------------------- */
  function initParticleCanvas() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles = [];
    const count = width < 768 ? 40 : 75;
    const connectionDist = width < 768 ? 95 : 125;

    let currentThemeParticleColors = (window.PortfolioTheme && window.PortfolioTheme.getCurrentThemeConfig().particleColors)
      ? window.PortfolioTheme.getCurrentThemeConfig().particleColors
      : ["56, 189, 248", "99, 102, 241"];

    window.addEventListener("portfolio:themechange", function (e) {
      if (e.detail && e.detail.theme && e.detail.theme.particleColors) {
        currentThemeParticleColors = e.detail.theme.particleColors;
        particles.forEach(function (p) {
          p.color = Math.random() > 0.4 ? currentThemeParticleColors[0] : currentThemeParticleColors[1];
        });
      }
    });

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 1.6 + 0.8;
        this.alpha = Math.random() * 0.5 + 0.25;
        this.color = Math.random() > 0.4 ? currentThemeParticleColors[0] : currentThemeParticleColors[1];
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Connect near particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionDist) {
            const lineAlpha = (1 - dist / connectionDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${currentThemeParticleColors[0]}, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });
  }

  // Initialize on DOM load
  document.addEventListener("DOMContentLoaded", () => {
    initParticleCanvas();
    updateScoreDisplay();
    updateSoundUI();
    setGameMode(gameMode);
    setDifficulty(difficulty);
  });

})();
