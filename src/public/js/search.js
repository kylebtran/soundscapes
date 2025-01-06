const cacheSize = 250;

class Search {
  constructor() {
    this.searchInput = document.getElementById("searchInput");
    this.resultsContainer = document.getElementById("results");
    this.searchTimeout = null;
    this.currentAudio = null;
    this.cache = this.loadCache();
    this.lastCleanup = Date.now();
    this.nextId = this.determineNextId();

    this.setupEventListeners();
    this.cleanupExpiredCache();
  }

  determineNextId() {
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

  setupEventListeners() {
    this.searchInput.addEventListener("input", () => {
      this.debounce(() => this.performSearch(), 300);
    });

    this.resultsContainer.addEventListener("click", (event) => {
      const button = event.target.closest(".play-button");
      if (button) {
        event.preventDefault();
        const audioSrc = button.getAttribute("data-preview");
        this.playAudio(audioSrc);
      }
    });
  }

  debounce(func, wait) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(func, wait);
  }

  loadCache() {
    try {
      const cached = localStorage.getItem("searchCache");
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error("Error loading cache:", error);
      return [];
    }
  }

  saveToCache(results) {
    const newItems = results.filter(
      (item) => !this.cache.some((cached) => cached.id === item.id)
    );
    if (newItems.length) {
      this.cache = [...this.cache, ...newItems].slice(-cacheSize);
      localStorage.setItem("searchCache", JSON.stringify(this.cache));
    }
  }

  async performSearch() {
    const query = this.searchInput.value.trim();

    if (!query) {
      if (this.cache.length) {
        this.displayResults(this.cache, true);
      }
      return;
    }

    try {
      const response = await fetch(
        `/search/api/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      this.saveToCache(data.results);
      this.displayResults(data.results);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  async displayResults(results, isCached = false) {
    if (!results.length) {
      this.resultsContainer.innerHTML =
        '<div class="absolute-center text-xl font-light">No results found</div>';
      return;
    }

    const preloadImages = results.map((item) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = item.album.cover_small;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });

    await Promise.all(preloadImages);
    const cacheColor = isCached ? "text-muted" : "text-primary";

    this.resultsContainer.innerHTML = results
      .map(
        (item) => `
            <a href="/track/${
              item.id
            }" class="container-fluid no-padding flex flex-col items-center font-light">
            <div class="flex w-[calc(100%-30px)] h-[1px] bg-muted"></div>
            <div class="w-full grid grid-cols-4 relative items-center text-xl h-[58px]">
                <div class="flex col-span-2 items-center px-4 space-x-8">
                <button class="play-button" data-preview="${item.preview}">
                <img
                    src="${item.album.cover_small}"
                    alt="${item.title}"
                    class="w-8 h-8"
                />
                </button>
                <div class="line-clamp-1 truncate">${item.title}</div>
                </div>
                <div class="flex px-4">
                <div class="-translate-x-10 line-clamp-1 truncate">${
                  item.artist.name
                }</div>
                </div>
                <div class="flex justify-between items-center px-4">
                <div class="-translate-x-[99px] line-clamp-1 truncate">${
                  item.album.title
                }</div>
                <div class="font-mono text-base ${cacheColor}">${
          isCached ? "CACHED" : "NEW"
        }</div>
                </div>
            </div>
            </a>
            `
      )
      .join("");
  }

  playAudio(audioSrc) {
    try {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }
      console.log(audioSrc);
      this.currentAudio = new Audio(audioSrc);
      this.currentAudio.play();
    } catch (error) {
      console.log("Playback error:", error);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Search();
});
