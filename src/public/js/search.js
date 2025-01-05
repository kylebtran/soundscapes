class Search {
  constructor() {
    this.searchInput = document.getElementById("searchInput");
    this.resultsContainer = document.getElementById("results");
    this.searchTimeout = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.searchInput.addEventListener("input", () => {
      this.debounce(() => this.performSearch(), 300);
    });
  }

  debounce(func, wait) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(func, wait);
  }

  async performSearch() {
    const query = this.searchInput.value.trim();

    if (!query) {
      this.resultsContainer.innerHTML = "";
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

      this.displayResults(data.results);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  displayResults(results) {
    if (!results.length) {
      this.resultsContainer.innerHTML =
        '<div class="no-results absolute-center text-xl font-light">No results found</div>';
      return;
    }

    this.resultsContainer.innerHTML = results
      .map(
        (item) => `
            <a href="/track/${item.id}" class="container-fluid no-padding flex flex-col items-center font-light">
            <div class="flex w-[calc(100%-30px)] h-[1px] bg-muted"></div>
            <div class="w-full grid grid-cols-4 relative items-center text-xl h-[58px]">
                <div class="flex col-span-2 items-center px-4 space-x-8">
                <img
                    src="${item.album.cover_small}"
                    alt="${item.title}"
                    class="w-8 h-8"
                />
                <div class="line-clamp-1 truncate">${item.title}</div>
                </div>
                <div class="flex px-4">
                <div class="-translate-x-10 line-clamp-1 truncate">${item.artist.name}</div>
                </div>
                <div class="flex justify-between items-center px-4">
                <div class="-translate-x-[99px] line-clamp-1 truncate">${item.album.title}</div>
                <div class="font-mono text-base text-primary">NEW</div>
                </div>
            </div>
            </a>
            `
      )
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Search();
});
