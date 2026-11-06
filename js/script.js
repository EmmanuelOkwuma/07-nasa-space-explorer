// NASA Space Explorer — Project 7
// dateRange.js is intentionally unchanged.

const startInput = document.getElementById("startDate");
const endInput = document.getElementById("endDate");
const gallery = document.getElementById("gallery");
const searchButton = document.getElementById("searchButton");
const resultCount = document.getElementById("resultCount");

const modal = document.getElementById("imageModal");
const modalMedia = document.getElementById("modalMedia");
const modalTitle = document.getElementById("modalTitle");
const modalDate = document.getElementById("modalDate");
const modalExplanation = document.getElementById("modalExplanation");
const closeModalButton = document.getElementById("closeModal");

setupDateInputs(startInput, endInput);

const API_KEY = "T6LbdgGwrqwzhGLcB7MFjMMRBfzQfbfhQT6MwDGQ";
const NASA_API_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic";

const spaceFacts = [
  "Sunlight takes approximately 8 minutes and 20 seconds to reach Earth.",
  "Venus rotates so slowly that one rotation takes longer than one Venusian year.",
  "A day on Mars lasts approximately 24 hours and 39 minutes.",
  "Jupiter is the largest planet in our solar system.",
  "Saturn's rings consist mainly of countless pieces of ice and rocky material.",
  "Neptune takes approximately 165 Earth years to orbit the Sun.",
  "The Moon is moving away from Earth by about 3.8 centimeters per year.",
  "The International Space Station orbits Earth approximately every 90 minutes."
];

document.getElementById("spaceFact").textContent =
  spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

function showMessage(message) {
  gallery.replaceChildren();
  const p = document.createElement("p");
  p.className = "placeholder";
  p.textContent = message;
  gallery.appendChild(p);
}

function dayCount(startDate, endDate) {
  const start = Date.parse(startDate + "T00:00:00Z");
  const end = Date.parse(endDate + "T00:00:00Z");
  return Math.round((end - start) / 86400000) + 1;
}

async function getSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate || dayCount(startDate, endDate) !== 9) {
    showMessage("Please select exactly nine consecutive days.");
    return;
  }

  showMessage("Loading space photos...");
  resultCount.textContent = "LOADING";
  searchButton.disabled = true;

  try {
    const perPage = 25;
    const selected = new Map();
    const today = new Date().toISOString().slice(0, 10);

    const daysBack = Math.max(0, dayCount(endDate, today) - 1);
    let page = Math.max(1, Math.floor(daysBack / perPage) + 1);

    const visited = new Set();

    for (let attempt = 0; attempt < 20; attempt++) {
      if (page < 1 || visited.has(page)) break;
      visited.add(page);

      const url = new URL(NASA_API_URL);
      url.searchParams.set("per_page", perPage);
      url.searchParams.set("page", page);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("NASA API returned HTTP " + response.status);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("NASA returned no archive entries.");
      }

      for (const item of data) {
        if (item.date >= startDate && item.date <= endDate) {
          selected.set(item.date, item);
        }
      }

      if (selected.size === 9) break;

      const dates = data.map(item => item.date).sort();
      const oldest = dates[0];
      const newest = dates[dates.length - 1];

      if (oldest > endDate) {
        page++;
      } else if (newest < startDate) {
        page--;
      } else if (oldest > startDate) {
        page++;
      } else {
        page--;
      }
    }

    const results = [...selected.values()].sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    if (results.length !== 9) {
      throw new Error(
        `Expected 9 entries, but found ${results.length}.`
      );
    }

    displayGallery(results);

  } catch (error) {
    console.error("NASA API error:", error);
    resultCount.textContent = "REQUEST FAILED";
    showMessage("Unable to retrieve all nine NASA entries. Please try again.");
  } finally {
    searchButton.disabled = false;
  }
}
function displayGallery(data) {
  gallery.replaceChildren();

  data.sort((a, b) => a.date.localeCompare(b.date));

  data.forEach(item => {
    const card = document.createElement("article");
    card.className = "gallery-item";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "View details: " + item.title);

    const media = document.createElement("div");
    media.className = "gallery-media";

    if (item.media_type === "video") {
      const video = document.createElement("div");
      video.className = "video-placeholder";
      video.innerHTML = '<span class="play-icon">▶</span><span>SPACE VIDEO</span>';
      media.appendChild(video);
    } else if (item.media_type === "image") {
      const img = document.createElement("img");
      img.src = item.hdurl || item.url;
      img.alt = item.title || "NASA astronomy image";
      img.loading = "lazy";
      media.appendChild(img);
    } else {
      media.textContent = "NASA MEDIA";
    }

    const info = document.createElement("div");
    info.className = "gallery-info";

    const date = document.createElement("time");
    date.dateTime = item.date;
    date.textContent = item.date;

    const title = document.createElement("h3");
    title.textContent = item.title || "Untitled NASA entry";

    info.append(date, title);
    card.append(media, info);

    card.addEventListener("click", () => openModal(item));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(item);
      }
    });

    gallery.appendChild(card);
  });

  resultCount.textContent = data.length + " DISCOVERIES";
}

let previouslyFocusedElement = null;

function openModal(item) {
  previouslyFocusedElement = document.activeElement;
  modalMedia.replaceChildren();

  if (item.media_type === "image") {
    const image = document.createElement("img");
    image.src = item.hdurl || item.url;
    image.alt = item.title || "NASA image";
    modalMedia.appendChild(image);
  } else if (item.media_type === "video") {
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "modal-video-link";
    link.textContent = "Watch NASA Space Video ↗";
    modalMedia.appendChild(link);
  }

  modalTitle.textContent = item.title || "NASA APOD";
  modalDate.textContent = item.date || "";
  const explanationDocument = new DOMParser().parseFromString(
    item.explanation || "No explanation available.",
    "text/html"
  );
  modalExplanation.textContent = explanationDocument.body.textContent;

  modal.hidden = false;
  document.body.classList.add("modal-open");
  closeModalButton.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  modalMedia.replaceChildren();
  if (previouslyFocusedElement) previouslyFocusedElement.focus();
}

closeModalButton.addEventListener("click", closeModal);
modal.querySelector("[data-close-modal]").addEventListener("click", closeModal);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

searchButton.addEventListener("click", getSpaceImages);
