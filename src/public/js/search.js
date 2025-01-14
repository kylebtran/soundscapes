const CACHE = {
  SIZE: 250,
  LIFETIME: 1000 * 60 * 60, // 1 hour
};

class Search {
  constructor() {
    this.searchContainer = document.getElementById("search");
    this.resultsContainer = document.getElementById("results");
    this.paginationContainer = document.getElementById("pagination");
    this.playContainer = document.getElementById("play");

    this.searchTimeout = null;
    this.currentAudio = null;
    this.cache = this.getCache();
    this.lastCleanup = Date.now();
    this.nextId = this.getNextId();
    this.playlist = [];
    this.currentTrackIndex = -1;
    this.isPlaying = false;

    this.searchContainer.addEventListener("input", () => {
      this.debounce(() => this.search(), 300);
    });
    this.playContainer.addEventListener("click", () => this.togglePlaylist());
    this.setEventListeners();
    this.cleanupExpiredCache();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("q")) {
      this.search(parseInt(urlParams.get("page")));
    }
  }

  getNextId() {
    let maxCacheId = 0;
    Object.values(this.cache).forEach((cacheEntry) => {
      cacheEntry.results.forEach((item) => {
        if (item.cacheId && item.cacheId > maxCacheId) {
          maxCacheId = item.cacheId;
        }
      });
    });
    return maxCacheId + 1;
  }

  setEventListeners() {
    // Pagination listener
    const paginationClone = this.paginationContainer.cloneNode(true);
    this.paginationContainer.parentNode.replaceChild(
      paginationClone,
      this.paginationContainer
    );
    this.paginationContainer = paginationClone;

    this.paginationContainer.addEventListener("click", (event) => {
      const button = event.target.closest(".pagination-btn");
      if (!button || button.disabled) return;

      const action = button.getAttribute("data-action");
      const targetPage = parseInt(button.getAttribute("data-page"), 10);
      const currentPage =
        parseInt(new URLSearchParams(window.location.search).get("page")) || 1;
      const totalPages = window.initialMeta.totalPages;

      let newPage;
      if (action === "first") {
        newPage = 1;
      } else if (action === "prev") {
        newPage = Math.max(1, currentPage - 1);
      } else if (action === "next") {
        newPage = Math.min(totalPages, currentPage + 1);
      } else if (action === "last") {
        newPage = totalPages;
      } else if (action === "page") {
        newPage = targetPage;
      } else {
        return;
      }

      if (newPage !== currentPage) {
        event.preventDefault();
        this.search(newPage);
      }
    });

    // Audio preview listener
    this.resultsContainer.addEventListener("click", (event) => {
      const button = event.target.closest(".play-button");
      if (button) {
        event.preventDefault();
        const audioSrc = button.getAttribute("data-preview");
        this.playAudio(audioSrc);
      }
    });
  }

  getCache() {
    try {
      const cached = localStorage.getItem("searchCache");
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error("Error loading cache:", error);
      return {};
    }
  }

  setStatus(item) {
    if (item.cacheId && !item.isNew) {
      return {
        status: String(item.cacheId).padStart(3, "0"),
        color: "text-muted",
      };
    }
    return {
      status: "NEW",
      color: "text-primary",
    };
  }

  setCache() {
    try {
      const cacheEntries = Object.entries(this.cache);
      if (cacheEntries.length > CACHE.SIZE) {
        // Sorts by timestamp to keep most recent entries
        const sortedEntries = cacheEntries.sort(
          (a, b) => b[1].timestamp - a[1].timestamp
        );
        this.cache = Object.fromEntries(sortedEntries.slice(0, CACHE.SIZE));
      }
      localStorage.setItem("searchCache", JSON.stringify(this.cache));
    } catch (error) {
      console.error("Error saving cache:", error);
    }
  }

  getIsCacheExpired(timestamp) {
    return Date.now() - timestamp > CACHE.LIFETIME;
  }

  cleanupExpiredCache() {
    const now = Date.now();
    if (now - this.lastCleanup < CACHE.LIFETIME) {
      return;
    }

    const validEntries = Object.entries(this.cache).filter(
      ([_, data]) => !this.getIsCacheExpired(data.timestamp)
    );
    this.cache = Object.fromEntries(validEntries);
    this.setCache();
    this.lastCleanup = now;
  }

  getCacheKey(query, page) {
    return `${query}:${page}`;
  }

  findInCache(query, page) {
    const cacheKey = this.getCacheKey(query, page);
    const { results, meta, timestamp } = this.cache[cacheKey] || {};
    if (results && !this.getIsCacheExpired(timestamp)) {
      const newResults = results.map((item) => ({
        ...item,
        isNew: false,
      }));
      return { results: newResults, meta };
    }
    return null;
  }

  findExistingCacheId(itemId) {
    for (const cacheEntry of Object.values(this.cache)) {
      const existingItem = cacheEntry.results.find(
        (item) => item.id === itemId
      );
      if (existingItem && existingItem.cacheId) {
        return existingItem.cacheId;
      }
    }
    return null;
  }

  getRecentResults() {
    const recentEntries = Object.entries(this.cache)
      .filter(([_, data]) => !this.getIsCacheExpired(data.timestamp))
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    if (recentEntries.length === 0) return [];
    return recentEntries[0][1].results;
  }

  debounce(func, wait) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(func, wait);
  }

  async search(page = 1) {
    const query = this.searchContainer.value.trim().toLowerCase();

    try {
      let html, results;

      const cachedResults = this.findInCache(query, page);
      if (cachedResults) {
        const response = await fetch("/search/render-partials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            results: cachedResults.results,
            meta: cachedResults.meta,
          }),
        });

        const data = await response.json();
        if (!data.success) return;

        window.initialMeta = cachedResults.meta;
        html = data.html;
        results = cachedResults.results;
      } else {
        const response = await fetch(
          `/search?q=${encodeURIComponent(query)}&page=${page}`,
          {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          }
        );
        const data = await response.json();
        if (!data.success) return;

        window.initialMeta = data.data.meta;

        const imagePromises = data.data.results.map(
          ({ album }) =>
            new Promise((resolve) => {
              if (!album?.cover_small) return resolve();
              const img = new Image();
              img.onload = img.onerror = () => resolve();
              img.src = album.cover_small;
            })
        );
        await Promise.all(imagePromises);

        html = data.html;
        results = data.data.results.map((item) => {
          const existingId = this.findExistingCacheId(item.id);
          if (existingId) {
            return { ...item, cacheId: existingId, isNew: false };
          } else {
            return { ...item, cacheId: this.nextId++, isNew: true };
          }
        });

        if (query) {
          const cacheKey = this.getCacheKey(query, page);
          this.cache[cacheKey] = {
            results: results,
            meta: data.data.meta,
            timestamp: Date.now(),
          };
          this.setCache();
        }
      }

      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = html.results;
      const newResults = tempContainer.firstElementChild;

      const tempPagination = document.createElement("div");
      tempPagination.innerHTML = html.pagination;
      const newPagination = tempPagination.firstElementChild;

      const statusElements = tempContainer.querySelectorAll(
        ".font-mono.text-base"
      );
      results.forEach((item, index) => {
        const statusElement = statusElements[index];
        if (statusElement) {
          if (!query) {
            statusElement.textContent = "DEMO";
            statusElement.className =
              "font-mono text-base text-muted hidden md:block text-muted";
          } else {
            const status = this.setStatus(item);
            statusElement.textContent = status.status;
            statusElement.className = `font-mono text-base hidden md:block ${status.color}`;
          }
        }
      });

      if (newResults && newPagination) {
        this.resultsContainer.replaceWith(newResults);
        this.paginationContainer.replaceWith(newPagination);

        this.resultsContainer = document.getElementById("results");
        this.paginationContainer = document.getElementById("pagination");
      }

      const url = new URL(window.location);
      url.searchParams.set("q", query);
      url.searchParams.set("page", page);
      window.history.pushState({}, "", url);

      this.setEventListeners();
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  togglePlaylist() {
    if (this.isPlaying) {
      this.stopPlaylist();
    } else {
      this.startPlaylist();
    }
  }

  startPlaylist() {
    const playButtons = this.resultsContainer.querySelectorAll(".play-button");
    this.playlist = Array.from(playButtons).map((button) =>
      button.getAttribute("data-preview")
    );

    if (this.playlist.length === 0) return;

    this.isPlaying = true;
    this.currentTrackIndex = -1;
    this.playContainer.textContent = "STOP";
    this.playNextTrack();
  }

  stopPlaylist() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    this.isPlaying = false;
    this.currentTrackIndex = -1;
    this.playContainer.textContent = "PLAY";
  }

  playNextTrack() {
    if (!this.isPlaying) return;

    this.currentTrackIndex++;
    if (this.currentTrackIndex >= this.playlist.length) {
      this.stopPlaylist();
      return;
    }

    const audioSrc = this.playlist[this.currentTrackIndex];
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }

    this.currentAudio = new Audio(audioSrc);
    this.currentAudio.addEventListener("ended", () => this.playNextTrack());
    this.currentAudio.play().catch((error) => {
      console.error("Playback error:", error);
      this.playNextTrack();
    });
  }

  playAudio(audioSrc) {
    if (this.isPlaying) {
      this.stopPlaylist();
    }

    try {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;

        if (this.currentAudio.src == audioSrc) {
          this.currentAudio = null;

          return;
        }
      }
      this.currentAudio = new Audio(audioSrc);
      this.currentAudio.play();
    } catch (error) {
      console.error("Playback error:", error);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Search();
});
