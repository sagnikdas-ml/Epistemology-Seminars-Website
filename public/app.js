const SEMINARS_API_ENDPOINT = "/api/seminars.csv";

const upcomingList = document.getElementById("upcoming-list");
const pastList = document.getElementById("past-list");
const upcomingEmpty = document.getElementById("upcoming-empty");
const pastEmpty = document.getElementById("past-empty");

init().catch((err) => {
  upcomingEmpty.textContent = `Failed to load seminars: ${err.message}`;
  upcomingEmpty.classList.remove("hidden");
  pastEmpty.classList.add("hidden");
});

async function init() {
  const csvText = await loadCsvFromApi(SEMINARS_API_ENDPOINT);
  const seminars = parseCsv(csvText)
    .map(normalizeSeminar)
    .filter((item) => item.ok)
    .map((item) => item.value)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  renderSeminars(seminars);
}

async function loadCsvFromApi(source) {
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const csvText = await response.text();
  if (!csvText.trim()) {
    throw new Error("Seminar feed is empty");
  }

  return csvText;
}

function parseCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => splitCsvLine(line));

  return rows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = (row[index] || "").trim();
    });
    return obj;
  });
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function normalizeSeminar(raw) {
  const requiredFields = ["date", "speaker", "title"];
  const missing = requiredFields.find((field) => !raw[field]);
  const registerLink = (raw.link || raw.register_link || "").trim();

  if (missing || !registerLink) {
    return { ok: false };
  }

  const time = (raw.time || "").trim();
  const parsedDate = parseDate(raw.date, time);
  if (!parsedDate) {
    return { ok: false };
  }

  const published = (raw.published || "yes").trim().toLowerCase();

  return {
    ok: true,
    value: {
      date: parsedDate,
      hasTime: Boolean(time),
      title: raw.title,
      speaker: raw.speaker,
      venue: raw.venue || "",
      registerLink,
      abstract: raw.abstract || "",
      isPublished: published !== "no",
    },
  };
}

function parseDate(dateInput, timeInput) {
  const effectiveTime = timeInput || "23:59";
  const dateTime = new Date(`${dateInput}T${effectiveTime}`);
  if (Number.isNaN(dateTime.getTime())) {
    return null;
  }
  return dateTime;
}

function renderSeminars(seminars) {
  const now = new Date();
  const visible = seminars.filter((s) => s.isPublished);
  const upcoming = visible.filter((s) => s.date >= now);
  const past = visible.filter((s) => s.date < now).reverse();

  renderCardGroup(upcomingList, upcoming, false);
  renderCardGroup(pastList, past, true);

  upcomingEmpty.classList.toggle("hidden", upcoming.length > 0);
  pastEmpty.classList.toggle("hidden", past.length > 0);
}

function renderCardGroup(target, seminars, isPast) {
  target.innerHTML = "";
  seminars.forEach((seminar, index) => {
    const card = document.createElement("article");
    card.className = "card";
    card.style.animationDelay = `${Math.min(index * 40, 240)}ms`;

    const dateLabel = seminar.date.toLocaleString(
      undefined,
      seminar.hasTime
        ? {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }
        : {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          }
    );

    const metaPieces = [escapeHtml(dateLabel)];
    if (seminar.venue) {
      metaPieces.push(escapeHtml(seminar.venue));
    }

    card.innerHTML = `
      <span class="chip">${isPast ? "Past Seminar" : "Upcoming Seminar"}</span>
      <h3>${escapeHtml(seminar.title)}</h3>
      <p class="speaker">${escapeHtml(seminar.speaker)}</p>
      <div class="card-meta">${metaPieces.join(" &middot; ")}</div>
      ${seminar.abstract ? `<p>${escapeHtml(seminar.abstract)}</p>` : ""}
      ${
        isPast
          ? ""
          : `<a class="register-link" href="${escapeAttribute(seminar.registerLink)}" target="_blank" rel="noopener noreferrer">Open Link</a>`
      }
    `;

    target.appendChild(card);
  });
}

function escapeHtml(value) {
  const text = String(value ?? "");
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}
