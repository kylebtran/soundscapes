const CACHE = {
  SIZE: 250,
  LIFETIME: 1000 * 60 * 60, // 1 hour
};

class Search {
  constructor() {
    this.searchContainer = document.getElementById("search");
    this.resultsContainer = document.getElementById("results");
    this.paginationContainer = document.getElementById("pagination");

    this.searchTimeout = null;
    this.currentAudio = null;
    this.cache = this.getCache();
    this.lastCleanup = Date.now();
    this.nextId = this.getNextId();

    this.searchContainer.addEventListener("input", () => {
      this.debounce(() => this.search(), 300);
    });
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
    const existingId = this.findExistingCacheId(item.id);

    if (existingId) {
      return {
        status: String(existingId).padStart(3, "0"),
        color: "text-muted",
      };
    }
    item.cacheId = this.nextId++;
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
      return { results, meta };
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
    console.log("Added new item to cache:", itemId);
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

    const cachedResults = this.findInCache(query, page);
    if (cachedResults) {
      try {
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

        if (data.success) {
          window.initialMeta = cachedResults.meta;

          this.resultsContainer.innerHTML = data.html.results;
          this.paginationContainer.innerHTML = data.html.pagination;

          const statusElements = this.resultsContainer.querySelectorAll(
            "[data-track-status]"
          );
          cachedResults.results.forEach((item, index) => {
            const statusElement = statusElements[index];
            if (statusElement) {
              const status = this.setStatus(item);
              statusElement.textContent = status.status;
              statusElement.className = `font-mono text-base ${status.color}`;
            }
          });

          const url = new URL(window.location);
          url.searchParams.set("q", query);
          url.searchParams.set("page", page);
          window.history.pushState({}, "", url);
          console.log(
            "Restored cached results for:",
            this.getCacheKey(query, page)
          );

          return;
        }
      } catch (error) {
        console.error("Error rendering cached results:", error);
      }
    }

    try {
      const response = await fetch(
        `/search?q=${encodeURIComponent(query)}&page=${page}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );
      const data = await response.json();

      if (data.success) {
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

        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = data.html.results;
        const newResults = tempContainer.firstElementChild;

        const tempPagination = document.createElement("div");
        tempPagination.innerHTML = data.html.pagination;
        const newPagination = tempPagination.firstElementChild;

        const statusElements = tempContainer.querySelectorAll(
          ".font-mono.text-base"
        );
        data.data.results.forEach((item, index) => {
          const statusElement = statusElements[index];
          if (statusElement) {
            if (!query) {
              statusElement.textContent = "DEMO";
              statusElement.className = "font-mono text-base text-muted";
            } else {
              const status = this.setStatus(item);
              statusElement.textContent = status.status;
              statusElement.className = `font-mono text-base ${status.color}`;
            }
          }
        });

        if (newResults && newPagination) {
          this.resultsContainer.replaceWith(newResults);
          this.paginationContainer.replaceWith(newPagination);

          this.resultsContainer = document.getElementById("results");
          this.paginationContainer = document.getElementById("pagination");
        }

        if (query) {
          const cacheKey = this.getCacheKey(query, page);
          this.cache[cacheKey] = {
            results: data.data.results,
            meta: data.data.meta,
            timestamp: Date.now(),
          };
          this.setCache();
        }

        const url = new URL(window.location);
        url.searchParams.set("q", query);
        url.searchParams.set("page", page);
        window.history.pushState({}, "", url);

        this.setEventListeners();
      }
    } catch (error) {
      console.error("Search error:", error);
    }
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
