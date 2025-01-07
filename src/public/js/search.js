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

    this.setEventListeners();
    this.cleanupExpiredCache();

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get("q");
    if (initialQuery) {
      const page = parseInt(urlParams.get("page")) || 1;
      this.displayPagination(window.initialMeta || { page, totalPages: 1 });
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
    // Search listener
    this.searchContainer.addEventListener("input", () => {
      this.debounce(() => this.search(), 300);
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

    // Pagination listener
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
    } else {
      item.cacheId = this.nextId++;
      return {
        status: "NEW",
        color: "text-primary",
      };
    }
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

  findInCache(query) {
    // query = query.toLowerCase();
    const { results, timestamp } = this.cache[query] || {};
    if (results && !this.getIsCacheExpired(timestamp)) {
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
        `/search/api/search?q=${encodeURIComponent(query)}&page=${page}`
      );
      const data = await response.json();

      // Commented out to avoid saving cache while page # isn't being cached
      // this.cache[query] = {
      //   results: data.results,
      //   timestamp: Date.now(),
      // };
      // this.saveCache();

      if (data.success) {
        await this.displayResults(data.results);
        this.displayPagination(data.meta);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      const url = new URL(window.location);
      url.searchParams.set("q", query);
      url.searchParams.set("page", page);
      window.history.pushState({}, "", url);
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
      });
    });

    await Promise.all(preloadImages);

    this.resultsContainer.innerHTML = results
      .map((item) => {
        const status = this.setStatus(item);
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

  displayPagination(meta) {
    const { page, totalPages } = meta;
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

    this.paginationContainer.innerHTML = `
    <div class="container-fluid">
      <div class="flex w-full gap-5 justify-end">
        <button
          class="pagination-btn ${page === 1 ? "disabled" : ""}"
          data-action="first"
          ${page === 1 ? "disabled" : ""}
        >q</button>
        <button
          class="pagination-btn ${page === 1 ? "disabled" : ""}"
          data-action="prev"
          ${page === 1 ? "disabled" : ""}
        >w</button>
        ${
          startPage > 1
            ? `
          <button class="pagination-btn" data-action="page" data-page="1">1</button>
          ${startPage > 2 ? '<span class="pagination-ellipsis">...</span>' : ""}
          `
            : ""
        }
        ${Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        )
          .map(
            (i) => `
            <button
              class="pagination-btn ${i === page ? "active" : ""}"
              data-action="page"
              data-page="${i}"
            >${i}</button>
          `
          )
          .join("")}
        ${
          endPage < totalPages
            ? `
          ${
            endPage < totalPages - 1
              ? '<span class="pagination-ellipsis">...</span>'
              : ""
          }
          <button class="pagination-btn" data-action="page" data-page="${totalPages}">${totalPages}</button>
          `
            : ""
        }
        <button
          class="pagination-btn ${page === totalPages ? "disabled" : ""}"
          data-action="next"
          ${page === totalPages ? "disabled" : ""}
        >o</button>
        <button
          class="pagination-btn ${page === totalPages ? "disabled" : ""}"
          data-action="last"
          ${page === totalPages ? "disabled" : ""}
        >p</button>
      </div>
    </div>
    `;

    this.paginationContainer.querySelectorAll("button").forEach((button) => {
      const action = button.getAttribute("data-action");
      const targetPage = parseInt(button.getAttribute("data-page"), 10);
      if (action === "first") {
        button.addEventListener("click", () => this.search(1));
      } else if (action === "prev") {
        button.addEventListener("click", () => this.search(page - 1));
      } else if (action === "next") {
        button.addEventListener("click", () => this.search(page + 1));
      } else if (action === "last") {
        button.addEventListener("click", () => this.search(totalPages));
      } else if (action === "page") {
        button.addEventListener("click", () => this.search(targetPage));
      }
    });
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
