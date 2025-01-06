const CACHE_SIZE = 250;
const CACHE_LIFETIME = 1000 * 60 * 60; // 1 hour

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
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error("Error loading cache:", error);
      return {};
    }
  }

  saveCache() {
    try {
      const cacheEntries = Object.entries(this.cache);
      if (cacheEntries.length > CACHE_SIZE) {
        // Sorts by timestamp to keep most recent entries
        const sortedEntries = cacheEntries.sort(
          (a, b) => b[1].timestamp - a[1].timestamp
        );
        this.cache = Object.fromEntries(sortedEntries.slice(0, CACHE_SIZE));
      }
      localStorage.setItem("searchCache", JSON.stringify(this.cache));
    } catch (error) {
      console.error("Error saving cache:", error);
    }
  }

  isCacheExpired(timestamp) {
    return Date.now() - timestamp > CACHE_LIFETIME;
  }

  cleanupExpiredCache() {
    const now = Date.now();
    if (now - this.lastCleanup < CACHE_LIFETIME) {
      return;
    }

    const validEntries = Object.entries(this.cache).filter(
      ([_, data]) => !this.isCacheExpired(data.timestamp)
    );
    this.cache = Object.fromEntries(validEntries);
    this.saveCache();
    this.lastCleanup = now;
  }

  findInCache(query) {
    query = query.toLowerCase();
    const { results, timestamp } = this.cache[query] || {};
    if (results && !this.isCacheExpired(timestamp)) {
      return results;
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
      .filter(([_, data]) => !this.isCacheExpired(data.timestamp))
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    if (recentEntries.length === 0) return [];
    return recentEntries[0][1].results;
  }

  async performSearch() {
    const query = this.searchInput.value.trim().toLowerCase();

    if (!query) {
      const recentResults = this.getRecentResults();
      if (recentResults.length) {
        this.displayResults(recentResults);
      } else {
        this.resultsContainer.innerHTML = "";
      }
      return;
    }

    const cachedResults = this.findInCache(query);
    if (cachedResults) {
      this.displayResults(cachedResults);
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

      this.cache[query] = {
        results: data.results,
        timestamp: Date.now(),
      };
      this.saveCache();

      this.displayResults(data.results);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  assignItemStatus(item) {
    const existingId = this.findExistingCacheId(item.id);

    if (existingId) {
      return {
        status: String(existingId).padStart(3, "0"),
        color: "text-muted",
      };
    } else {
      item.cacheId = this.nextId++;
      return {
        status: "NEW",
        color: "text-primary",
      };
    }
  }

  async displayResults(results) {
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

    this.resultsContainer.innerHTML = results
      .map((item) => {
        const status = this.assignItemStatus(item);
        return `
          <a href="/track/${item.id}" 
             class="container-fluid no-padding flex flex-col items-center font-light">
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
                <div class="-translate-x-10 line-clamp-1 truncate">
                  ${item.artist.name}
                </div>
              </div>
              <div class="flex justify-between items-center px-4">
                <div class="-translate-x-[99px] line-clamp-1 truncate">
                  ${item.album.title}
                </div>
                <div class="font-mono text-base ${status.color}">
                  ${status.status}
                </div>
              </div>
            </div>
          </a>
        `;
      })
      .join("");
  }

  playAudio(audioSrc) {
    try {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
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
