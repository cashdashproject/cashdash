const events = [
	{ id: "upl-01", sport: "football", league: "УПЛ", time: "Сьогодні · 18:30", home: "Верес Рівне", away: "Шахтар Донецьк", homeCode: "ВЕР", awayCode: "ШД", score: "0 : 0", live: true, odds: [3.75, 3.25, 1.92] },
	{ id: "pl-02", sport: "football", league: "Прем'єр-ліга", time: "Сьогодні · 20:00", home: "Брентфорд", away: "Челсі", homeCode: "БР", awayCode: "ЧС", score: "— : —", live: false, odds: [3.10, 3.45, 2.15] },
	{ id: "laliga-03", sport: "football", league: "Ла-Ліга", time: "Сьогодні · 21:00", home: "Жирона", away: "Валенсія", homeCode: "ЖИР", awayCode: "ВАЛ", score: "— : —", live: false, odds: [2.05, 3.20, 3.80] },
	{ id: "esport-04", sport: "esports", league: "Кіберспорт", time: "Мапа 2 · 14:05", home: "Team Spirit", away: "Aurora Gaming", homeCode: "TS", awayCode: "AG", score: "1 : 1", live: true, odds: [1.78, 2.04] },
	{ id: "tennis-05", sport: "tennis", league: "Теніс · ATP", time: "Сьогодні · 16:45", home: "О. Ковач", away: "М. Дюран", homeCode: "ОК", awayCode: "МД", score: "6 : 4", live: true, odds: [1.65, 2.20] },
	{ id: "bund-06", sport: "football", league: "Бундесліга", time: "Завтра · 19:30", home: "Баєр 04", away: "Боруссія Д", homeCode: "Б04", awayCode: "БД", score: "— : —", live: false, odds: [1.88, 3.70, 3.95] }
];

const state = {
	sport: "all",
	league: "all",
	filter: "all",
	mode: "single",
	search: "",
	selections: [],
	favorites: new Set(JSON.parse(localStorage.getItem("cashdash-favorites") || "[]"))
};

const eventGrid = document.querySelector("#event-grid");
const emptyResults = document.querySelector("#empty-results");
const couponSelections = document.querySelector("#coupon-selections");
const couponEmpty = document.querySelector("#coupon-empty");
const couponCalculation = document.querySelector("#coupon-calculation");
const stakeInput = document.querySelector("#stake-input");
let toastTimer;

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function visibleEvents() {
	return events.filter((event) => {
		const matchesSport = state.sport === "all" || event.sport === state.sport;
		const matchesLeague = state.league === "all" || event.league === state.league;
		const matchesFilter = state.filter === "all" || (state.filter === "live" ? event.live : state.favorites.has(event.id));
		const searchable = `${event.league} ${event.home} ${event.away}`.toLocaleLowerCase("uk");
		return matchesSport && matchesLeague && matchesFilter && searchable.includes(state.search.toLocaleLowerCase("uk"));
	});
}

function renderEvents() {
	const visible = visibleEvents();
	document.querySelector("#event-count").textContent = String(visible.length);
	emptyResults.hidden = visible.length > 0;
	eventGrid.innerHTML = visible.map((event) => {
		const favorite = state.favorites.has(event.id);
		const options = event.odds.length === 2
			? [["Перемога", event.home, event.odds[0]], ["Перемога", event.away, event.odds[1]]]
			: [["1", event.home, event.odds[0]], ["X", "Нічия", event.odds[1]], ["2", event.away, event.odds[2]]];
		return `<article class="event-card" data-event="${event.id}">
			<div class="event-meta"><div class="event-titleline"><span class="event-league">${escapeHtml(event.league)} · ${escapeHtml(event.time)}</span></div><span class="event-live">${event.live ? "● LIVE" : "ПРЕМАТЧ"}</span></div>
			<div class="event-teams">
				<div class="team"><span class="team-badge">${escapeHtml(event.homeCode)}</span><span class="team-name">${escapeHtml(event.home)}</span></div>
				<span class="event-score">${escapeHtml(event.score)}</span>
				<div class="team"><span class="team-badge">${escapeHtml(event.awayCode)}</span><span class="team-name">${escapeHtml(event.away)}</span></div>
			</div>
			<p class="market-title">${event.odds.length === 2 ? "Переможець матчу" : "Результат матчу · 1X2"}</p>
			<div class="odds-row">${options.map(([label, choice, odd]) => {
				const selected = state.selections.some((selection) => selection.eventId === event.id && selection.odd === odd && selection.choice === choice);
				return `<button class="odds-button${selected ? " is-selected" : ""}" type="button" data-event-id="${event.id}" data-choice="${escapeHtml(choice)}" data-odd="${odd}" aria-pressed="${selected}"><span>${escapeHtml(label === "Перемога" ? choice : `${label} · ${choice}`)}</span><strong>${odd.toFixed(2)}</strong></button>`;
			}).join("")}</div>
			<button class="event-favorite${favorite ? " is-favorite" : ""}" type="button" data-favorite="${event.id}" aria-label="${favorite ? "Прибрати з обраного" : "Додати в обране"}" aria-pressed="${favorite}">${favorite ? "★" : "☆"}</button>
		</article>`;
	}).join("");
}

function renderCoupon() {
	const count = state.selections.length;
	document.querySelector("#coupon-count").textContent = `${count} ${count === 1 ? "вибір" : "виборів"}`;
	couponEmpty.hidden = count > 0;
	couponCalculation.hidden = count === 0;
	couponSelections.innerHTML = state.selections.map((selection) => {
		const event = events.find((item) => item.id === selection.eventId);
		return `<article class="selection-item"><div class="selection-match">${escapeHtml(event.home)} — ${escapeHtml(event.away)}</div><div class="selection-choice"><span>${escapeHtml(selection.choice)}</span><strong>${selection.odd.toFixed(2)}</strong></div><button class="remove-selection" type="button" data-remove="${selection.eventId}" aria-label="Видалити вибір">×</button></article>`;
	}).join("");
	updateCalculation();
}

function updateCalculation() {
	const odds = state.selections.reduce((total, selection) => total * selection.odd, 1);
	const stake = Number(stakeInput.value);
	const totalOdds = state.mode === "single" ? (state.selections.at(-1)?.odd ?? 1) : odds;
	document.querySelector("#total-odds").textContent = totalOdds.toFixed(2);
	document.querySelector("#potential-win").textContent = `${(Number.isFinite(stake) && stake > 0 ? stake * totalOdds : 0).toFixed(2)} ₴`;
	document.querySelector("#place-bet").disabled = countSelectionsInvalid();
}

function countSelectionsInvalid() {
	return state.selections.length === 0 || !Number.isFinite(Number(stakeInput.value)) || Number(stakeInput.value) < 1;
}

function showToast(message) {
	const toast = document.querySelector("#toast");
	toast.textContent = message;
	toast.classList.add("is-visible");
	window.clearTimeout(toastTimer);
	toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

document.addEventListener("click", (event) => {
	const oddsButton = event.target.closest(".odds-button");
	if (oddsButton) {
		const { eventId, choice, odd } = oddsButton.dataset;
		const selectedIndex = state.selections.findIndex((selection) => selection.eventId === eventId);
		if (selectedIndex >= 0 && state.selections[selectedIndex].choice === choice) {
			state.selections.splice(selectedIndex, 1);
		} else {
			if (selectedIndex >= 0) state.selections.splice(selectedIndex, 1);
			state.selections.push({ eventId, choice, odd: Number(odd) });
		}
		renderEvents();
		renderCoupon();
		return;
	}

	const removeButton = event.target.closest("[data-remove]");
	if (removeButton) {
		state.selections = state.selections.filter((selection) => selection.eventId !== removeButton.dataset.remove);
		renderEvents();
		renderCoupon();
		return;
	}

	const favoriteButton = event.target.closest("[data-favorite]");
	if (favoriteButton) {
		const id = favoriteButton.dataset.favorite;
		state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
		localStorage.setItem("cashdash-favorites", JSON.stringify([...state.favorites]));
		renderEvents();
		return;
	}

	const sportButton = event.target.closest("[data-sport]");
	if (sportButton) {
		state.sport = sportButton.dataset.sport;
		state.league = "all";
		document.querySelectorAll(".sport-tab").forEach((button) => button.classList.toggle("is-active", button.dataset.sport === state.sport));
		document.querySelectorAll(".league-button").forEach((button) => button.classList.toggle("is-selected", button.dataset.league === "all"));
		renderEvents();
		document.querySelector("#events").scrollIntoView({ behavior: "smooth", block: "start" });
		return;
	}

	const leagueButton = event.target.closest("[data-league]");
	if (leagueButton) {
		state.league = leagueButton.dataset.league;
		state.sport = "all";
		document.querySelectorAll(".league-button").forEach((button) => button.classList.toggle("is-selected", button === leagueButton));
		document.querySelectorAll(".sport-tab").forEach((button) => button.classList.toggle("is-active", button.dataset.sport === "all"));
		renderEvents();
		return;
	}

	const filterButton = event.target.closest("[data-filter]");
	if (filterButton) {
		state.filter = filterButton.dataset.filter;
		document.querySelectorAll(".quick-filter, .view-filter").forEach((button) => button.classList.toggle("is-active", button.dataset.filter === state.filter));
		renderEvents();
		return;
	}

	const modeButton = event.target.closest("[data-mode]");
	if (modeButton) {
		state.mode = modeButton.dataset.mode;
		document.querySelectorAll(".coupon-tab").forEach((button) => {
			const active = button === modeButton;
			button.classList.toggle("is-active", active);
			button.setAttribute("aria-selected", String(active));
		});
		updateCalculation();
		return;
	}

	const stakeButton = event.target.closest("[data-stake]");
	if (stakeButton) {
		stakeInput.value = stakeButton.dataset.stake;
		updateCalculation();
		return;
	}

	if (event.target.closest("#clear-coupon")) {
		state.selections = [];
		renderEvents();
		renderCoupon();
		return;
	}

	if (event.target.closest("#place-bet")) {
		showToast("Це демо: реальні ставки тут не приймаються.");
		return;
	}

	if (event.target.closest("[data-live-shortcut]")) {
		state.filter = "live";
		document.querySelectorAll(".quick-filter, .view-filter").forEach((button) => button.classList.toggle("is-active", button.dataset.filter === "live"));
		renderEvents();
		document.querySelector("#events").scrollIntoView({ behavior: "smooth", block: "start" });
		return;
	}

	const toastButton = event.target.closest("[data-toast]");
	if (toastButton) showToast(toastButton.dataset.toast);
});

document.querySelector("#event-search").addEventListener("input", (event) => {
	state.search = event.target.value.trim();
	renderEvents();
});

document.addEventListener("keydown", (event) => {
	if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
		event.preventDefault();
		document.querySelector("#event-search").focus();
	}
});

stakeInput.addEventListener("input", updateCalculation);
renderEvents();
renderCoupon();
