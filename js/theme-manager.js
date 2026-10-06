/**
 * ==========================================================================
 * SHAHZAD BANGASH PORTFOLIO & ARCADE - THEME MANAGER
 * Unified Theme Engine for Portfolio, Bubble Pop Arcade, and Tic Tac Toe.
 *
 * Real-Time Cross-Page & Cross-Tab Synchronization:
 * - BroadcastChannel API for immediate (<5ms) inter-tab state broadcast
 * - Persistent localStorage prioritization
 * - Live dynamic link rewriting for games/portfolio
 * - Visibility & focus listeners for background-tab sync
 *
 * Direct Click Theme Toggle (Cycles 5 clean themes):
 * 1. Dark Blue (Default)
 * 2. Light Blue (Light Mode)
 * 3. Green
 * 4. Purple
 * 5. Red
 * ==========================================================================
 */

(function (window, document) {
  "use strict";

  const STORAGE_KEY = "shahzad_portfolio_theme";
  const DEFAULT_THEME = "dark-blue";
  const CHANNEL_NAME = "shahzad_portfolio_theme_channel";

  const THEME_ALIASES = {
    "dark-blue": "dark-blue",
    "cyber-dark": "dark-blue",
    "cyber-void": "dark-blue",
    "light-blue": "light-blue",
    "clean-light": "light-blue",
    "green": "green",
    "emerald-green": "green",
    "emerald-matrix": "green",
    "purple": "purple",
    "neon-purple": "purple",
    "neon-sakura": "purple",
    "red": "red",
    "arctic-blue": "red",
    "arctic-frost": "red",
    "amber": "dark-blue",
    "solar-amber": "dark-blue",
    "solar-flare": "dark-blue"
  };

  const THEMES = [
    {
      id: "dark-blue",
      name: "Dark Blue",
      isDefault: true,
      dots: ["#030712", "#38bdf8", "#6366f1"],
      particleColors: ["56, 189, 248", "99, 102, 241"],
      bubbleHues: [
        { bg: "linear-gradient(135deg, #06b6d4, #2563eb)", glow: "rgba(6, 182, 212, 0.4)" },
        { bg: "linear-gradient(135deg, #3b82f6, #6366f1)", glow: "rgba(59, 130, 246, 0.4)" },
        { bg: "linear-gradient(135deg, #0ea5e9, #0284c7)", glow: "rgba(14, 165, 233, 0.4)" },
        { bg: "linear-gradient(135deg, #38bdf8, #1d4ed8)", glow: "rgba(56, 189, 248, 0.4)" }
      ]
    },
    {
      id: "light-blue",
      name: "Light Blue",
      isDefault: false,
      dots: ["#f8fafc", "#0284c7", "#3b82f6"],
      particleColors: ["2, 132, 199", "99, 102, 241"],
      bubbleHues: [
        { bg: "linear-gradient(135deg, #0284c7, #2563eb)", glow: "rgba(2, 132, 199, 0.4)" },
        { bg: "linear-gradient(135deg, #059669, #0284c7)", glow: "rgba(5, 150, 105, 0.4)" },
        { bg: "linear-gradient(135deg, #7c3aed, #2563eb)", glow: "rgba(124, 58, 237, 0.4)" },
        { bg: "linear-gradient(135deg, #ea580c, #e11d48)", glow: "rgba(234, 88, 12, 0.4)" }
      ]
    },
    {
      id: "green",
      name: "Green",
      isDefault: false,
      dots: ["#020d07", "#10b981", "#a3e635"],
      particleColors: ["16, 185, 129", "45, 212, 191"],
      bubbleHues: [
        { bg: "linear-gradient(135deg, #10b981, #059669)", glow: "rgba(16, 185, 129, 0.45)" },
        { bg: "linear-gradient(135deg, #2dd4bf, #0d9488)", glow: "rgba(45, 212, 191, 0.45)" },
        { bg: "linear-gradient(135deg, #84cc16, #65a30d)", glow: "rgba(132, 204, 22, 0.45)" },
        { bg: "linear-gradient(135deg, #34d399, #059669)", glow: "rgba(52, 211, 153, 0.45)" }
      ]
    },
    {
      id: "purple",
      name: "Purple",
      isDefault: false,
      dots: ["#0d0414", "#ec4899", "#a855f7"],
      particleColors: ["236, 72, 153", "168, 85, 247"],
      bubbleHues: [
        { bg: "linear-gradient(135deg, #ec4899, #be185d)", glow: "rgba(236, 72, 153, 0.45)" },
        { bg: "linear-gradient(135deg, #a855f7, #7e22ce)", glow: "rgba(168, 85, 247, 0.45)" },
        { bg: "linear-gradient(135deg, #f472b6, #db2777)", glow: "rgba(244, 114, 182, 0.45)" },
        { bg: "linear-gradient(135deg, #d946ef, #9333ea)", glow: "rgba(217, 70, 239, 0.45)" }
      ]
    },
    {
      id: "red",
      name: "Red",
      isDefault: false,
      dots: ["#0d0205", "#ef4444", "#fb7185"],
      particleColors: ["239, 68, 68", "244, 63, 94"],
      bubbleHues: [
        { bg: "linear-gradient(135deg, #ef4444, #b91c1c)", glow: "rgba(239, 68, 68, 0.45)" },
        { bg: "linear-gradient(135deg, #f43f5e, #be123c)", glow: "rgba(244, 63, 94, 0.45)" },
        { bg: "linear-gradient(135deg, #fb7185, #e11d48)", glow: "rgba(251, 113, 133, 0.45)" },
        { bg: "linear-gradient(135deg, #dc2626, #991b1b)", glow: "rgba(220, 38, 38, 0.45)" }
      ]
    }
  ];

  let currentThemeId = DEFAULT_THEME;
  let audioCtx = null;
  let broadcastChannel = null;

  // Initialize BroadcastChannel for cross-tab theme communication
  try {
    if (typeof window.BroadcastChannel === "function") {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = function (event) {
        if (event && event.data && event.data.themeId) {
          const incomingTheme = normalizeThemeId(event.data.themeId);
          if (incomingTheme && incomingTheme !== currentThemeId) {
            applyTheme(incomingTheme, false, false);
          }
        }
      };
    }
  } catch (e) {
    console.warn("BroadcastChannel initialization warning:", e);
  }

  function normalizeThemeId(id) {
    if (!id) return DEFAULT_THEME;
    if (THEME_ALIASES[id]) return THEME_ALIASES[id];
    return id;
  }

  function getSavedTheme() {
    try {
      // 1. Check URL query parameter first (if explicitly specified in URL or link)
      const urlParams = new URLSearchParams(window.location.search);
      const urlTheme = normalizeThemeId(urlParams.get("theme"));
      if (urlTheme && THEMES.some(t => t.id === urlTheme)) {
        try {
          localStorage.setItem(STORAGE_KEY, urlTheme);
        } catch (_) {}
        return urlTheme;
      }

      // 2. Check persistent localStorage (user's active selection across entire site)
      const saved = normalizeThemeId(localStorage.getItem(STORAGE_KEY));
      if (saved && THEMES.some(t => t.id === saved)) {
        return saved;
      }
    } catch (e) {
      console.warn("Theme storage access error:", e);
    }
    return DEFAULT_THEME;
  }

  function getThemeConfig(themeId) {
    const norm = normalizeThemeId(themeId);
    return THEMES.find(t => t.id === norm) || THEMES[0];
  }

  /**
   * Dynamically rewrites all internal navigation links on the page so that
   * clicking any project link, back link, or game button opens the destination
   * in the exact active theme.
   */
  function updateInternalLinks(themeId) {
    // Standalone game: no external or portfolio link rewriting
  }

  /**
   * Harmonious pentatonic micro-tone for theme switching
   */
  function playThemeSound() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const currentIndex = THEMES.findIndex(t => t.id === currentThemeId);
      const freqs = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
      const freq = freqs[currentIndex >= 0 ? currentIndex : 0] || 587.33;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.1);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  function applyTheme(themeId, playAudio = false, shouldBroadcast = true) {
    const config = getThemeConfig(themeId);
    currentThemeId = config.id;

    // Apply attribute to html root
    document.documentElement.setAttribute("data-theme", currentThemeId);

    // Save preference to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, currentThemeId);
    } catch (e) {}

    // Update current page URL query param quietly (without page reload)
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("theme") || window.location.pathname.includes("projects/")) {
        url.searchParams.set("theme", currentThemeId);
        window.history.replaceState({ theme: currentThemeId }, "", url.toString());
      }
    } catch (e) {}

    // Synchronize all on-page internal links (projects, back links, games)
    updateInternalLinks(currentThemeId);

    // Update all theme switcher buttons in DOM
    updateAllUI();

    // Broadcast change across tabs and windows
    if (shouldBroadcast && broadcastChannel) {
      try {
        broadcastChannel.postMessage({ themeId: currentThemeId });
      } catch (e) {}
    }

    // Play micro-feedback audio if requested
    if (playAudio) {
      playThemeSound();
    }

    // Dispatch global event for canvas, games, and components
    window.dispatchEvent(
      new CustomEvent("portfolio:themechange", {
        detail: {
          themeId: currentThemeId,
          theme: config
        }
      })
    );
  }

  /**
   * Cycles directly to the next theme in the sequence:
   * Dark Blue -> Light Blue -> Green -> Purple -> Red -> Dark Blue
   */
  function cycleToNextTheme(playAudio = true) {
    const currentIndex = THEMES.findIndex(t => t.id === currentThemeId);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    const nextTheme = THEMES[nextIndex];
    applyTheme(nextTheme.id, playAudio, true);
  }

  function updateAllUI() {
    const config = getThemeConfig(currentThemeId);

    document.querySelectorAll(".theme-trigger-btn").forEach(btn => {
      // Update label text
      const label = btn.querySelector(".theme-label-text");
      if (label) {
        label.textContent = config.name;
      }

      // Update swatch dots
      const swatch = btn.querySelector(".theme-mini-swatch");
      if (swatch) {
        swatch.innerHTML = config.dots
          .map(c => `<span class="theme-dot" style="background:${c}"></span>`)
          .join("");
      }

      // Update button tooltip and accessible label
      btn.setAttribute("title", `Theme: ${config.name} (Click to switch)`);
      btn.setAttribute("aria-label", `Switch Theme (Current: ${config.name})`);
    });
  }

  /**
   * Sets up direct click-to-toggle behavior on theme switcher wrappers
   */
  function setupThemeSwitcher(wrapper) {
    if (!wrapper || wrapper.__themeInitialized) return;
    wrapper.__themeInitialized = true;

    // Remove any leftover popovers completely
    const existingPopover = wrapper.querySelector(".theme-popover");
    if (existingPopover) {
      existingPopover.remove();
    }

    const trigger = wrapper.querySelector(".theme-trigger-btn");
    if (!trigger) return;

    // Remove old dropdown attributes
    trigger.removeAttribute("aria-haspopup");
    trigger.removeAttribute("aria-expanded");
    trigger.setAttribute("title", "Click to switch theme");

    // Remove old caret if present
    const caret = trigger.querySelector(".theme-caret");
    if (caret) {
      caret.remove();
    }

    // Remove cycle icon if present (button is now icon-only)
    const existingCycleIcon = trigger.querySelector(".theme-cycle-icon");
    if (existingCycleIcon) {
      existingCycleIcon.remove();
    }

    // Remove swatch and label if present (button is now icon-only)
    const existingSwatch = trigger.querySelector(".theme-mini-swatch");
    if (existingSwatch) existingSwatch.remove();
    const existingLabel = trigger.querySelector(".theme-label-text");
    if (existingLabel) existingLabel.remove();

    // Direct click handler: cycle to next theme
    trigger.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      // Micro-animation click feedback
      trigger.classList.add("theme-switching");
      setTimeout(() => trigger.classList.remove("theme-switching"), 350);

      cycleToNextTheme(true);
    });
  }

  /**
   * Sync active theme with localStorage
   */
  function syncFromStorage() {
    try {
      const saved = normalizeThemeId(localStorage.getItem(STORAGE_KEY));
      if (saved && saved !== currentThemeId && THEMES.some(t => t.id === saved)) {
        applyTheme(saved, false, false);
      }
    } catch (e) {}
  }

  // Cross-tab storage synchronization fallback
  window.addEventListener("storage", e => {
    if (e.key === STORAGE_KEY && e.newValue) {
      const normalized = normalizeThemeId(e.newValue);
      if (normalized && normalized !== currentThemeId) {
        applyTheme(normalized, false, false);
      }
    }
  });

  // Re-sync immediately when tab gains focus or becomes visible
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncFromStorage();
    }
  });
  window.addEventListener("focus", syncFromStorage);
  window.addEventListener("pageshow", syncFromStorage);

  // Initialization
  function init() {
    const saved = getSavedTheme();
    applyTheme(saved, false, false);

    // Setup all theme switcher wrappers in DOM
    document.querySelectorAll(".theme-switcher-wrapper").forEach(setupThemeSwitcher);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Public API
  window.PortfolioTheme = {
    themes: THEMES,
    defaultTheme: DEFAULT_THEME,
    getCurrentTheme: () => currentThemeId,
    getCurrentThemeConfig: () => getThemeConfig(currentThemeId),
    setTheme: (id, playSound = true) => applyTheme(id, playSound, true),
    cycleTheme: () => cycleToNextTheme(true),
    setupSwitcher: setupThemeSwitcher
  };

})(window, document);
