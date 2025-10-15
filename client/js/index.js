import { addListenerParse } from "./parse.js";
import { renderSessCard } from "./session.js";
import { addListenerSetting, updateUISetting } from "./settings.js";
import { getElements } from "./elements.js";
import { getStruct, Q_TYPES, NAVIGATION, REASON } from "./struct.js";
import { show_popup, create_element, dateToYYYYMMDD, getIndexes, toBase64 } from "./utilities.js";

const browser = window.browser || window.chrome;
const local = browser.storage.local;

let INTERVALS = {
	timer: null,
};

let currnav = NAVIGATION.MODULES;
let currmodid = null;
let currunitid = null;

const POPUPS = {
	card_added: () =>
		show_popup({
			block_outside: true,
			title: "Successfully added",
			description: "Happy learning!",
			icon: '<svg><use href="#check"/></svg>',
			action: "Okay",
			width: 30,
			bg_color: "hsl(0, 0%, 10%)",
			text_color: "hsl(0, 0%, 90%)",
		}),
	complete_edit: () =>
		show_popup({
			block_outside: true,
			title: "Edit successfully",
			description: "Yay!",
			icon: '<svg><use href="#check"/></svg>',
			action: "Thanks",
			width: 30,
			bg_color: "hsl(0, 0%, 10%)",
			text_color: "hsl(0, 0%, 90%)",
		}),
	incomplete_input: () =>
		show_popup({
			block_outside: true,
			title: "Incomplete information",
			description: "You must complete necessary input field. Thank you and happy learning!",
			icon: '<svg><use href="#help"/></svg>',
			action: "Okay",
			width: 30,
			bg_color: "hsl(0, 0%, 10%)",
			text_color: "hsl(0, 0%, 90%)",
		}),
	welcome: () =>
		show_popup(
			{
				block_outside: true,
				title: "Hi, welcome!",
				description: "We're a bunch of BSCS students on a mission to make studying way easier (and a lot more fun)!<br><br>So what exactly is this thing we built 🤔?<br><br>Meet POP-APP — your brain's new best friend. It helps you lock in what you learn and remember it forever, right inside your browser!<br><br>Scrolling through TikTok? No problem — you can still sneak in a quick review with POP-APP.<br><br>We built this to make studying smoother, smarter, and to help you build stronger digital habits along the way.",
				icon: '<svg><use href="#help"/></svg>',
				action: "Hmm, how?",
				width: 30,
				bg_color: "hsla(0, 56%, 22%, 1.00)",
				text_color: "hsl(0, 0%, 90%)",
			},
			() =>
				show_popup(
					{
						block_outside: true,
						title: "Easier than you think!",
						description: "Hit that + button to create your own modules — think of them like subjects! For example, if you're studying English, that's your module.<br><br>Inside your English module, you can have units like Grammar, Vocabulary, or Literature. Each unit can then hold different cards — fun facts, key concepts, or bite-sized lessons that make learning stick.<br><br>These cards will pop up on your new tab page (or any tab you open) to keep your brain in gear — unless you've whitelisted a site, of course 👀.<br><br>You can choose between two smart scheduling algorithms to decide how often your cards appear — check out the Settings section for the full breakdown.<br><br>And if you don't feel like typing everything yourself, let our AI do the heavy lifting — it can automatically generate flashcards for you, turning your study notes into memory gold.",
						icon: '<svg><use href="#check"/></svg>',
						action: "Thanks. Never show up again.",
						width: 30,
						bg_color: "hsla(0, 56%, 22%, 1.00)",
						text_color: "hsl(0, 0%, 90%)",
					},
					async () => {
						const udata = await local.get(null);
						udata.settings.rules.shown_tips_new = true;
						await local.set(udata);
					}
				)
		),
};

init();

function startCounting(udata) {
	const time = new Date(udata.inject.time);
	const interval_ms = new Date(udata.settings.rules.interval_ms);

	if (INTERVALS.timer) clearInterval(INTERVALS.timer);

	INTERVALS.timer = setInterval(async () => {
		const elapsed_time = new Date() - time;
		console.log(elapsed_time);
		if (elapsed_time >= interval_ms) {
			const nudata = await local.get(null);
			nudata.inject.answered = false;

			await local.set(nudata);
			clearInterval(INTERVALS.timer);
		}
	}, 1000);
}

function renderModules(udata, parent) {
	parent.innerHTML = "";
	updatePath("Modules", ". >");
	if (udata.modules.length > 0) parent.append(makeModules(udata.modules));
}

function renderUnits(udata, moduleIndex, parent) {
	parent.innerHTML = "";
	updatePath("Units", `${udata.modules[moduleIndex].title} >`);
	if (udata.modules[moduleIndex].units.length > 0) parent.append(makeUnits(udata.modules[moduleIndex].units));
}

function renderCards(udata, moduleIndex, unitIndex, parent) {
	parent.innerHTML = "";
	updatePath("Units", `${udata.modules[moduleIndex].title} > ${udata.modules[moduleIndex].units[unitIndex].title} >`);
	if (udata.modules[moduleIndex].units[unitIndex].cards.length > 0) parent.append(makeCards(udata.modules[moduleIndex].units[unitIndex].cards));
}

function renderChoices(CCHO, CORC) {
	if (CCHO.value.trim() === "") {
		CORC.innerHTML = "";
		return;
	}
	const choices = CCHO.value.split(",");
	const parent = document.createDocumentFragment();
	for (const i in choices) {
		if (choices[i].trim() === "") return;
		const container = create_element("div", { class: "cchoice" });
		const radio = create_element("input", { type: "radio", name: "schoice", id: `schoice${i}`, value: i });
		const label = create_element("label", { for: `schoice${i}`, class: "schoice" }, [choices[i].trim()]);
		container.dataset.index = i;

		container.append(radio);
		container.append(label);
		parent.append(container);
	}
	CORC.innerHTML = "";
	CORC.append(parent);
}

async function init() {
	await initStorage();
	addListenerSettingSide();
	addListenerLibrary();
	addListenerSetting();
	addListenerParse();

	const udata = await local.get(null);
	const { getLibraryElements, getSessionBody } = getElements();
	const { SCARDC } = getSessionBody();

	const { CONTENT } = getLibraryElements();

	if (udata.inject.answered) {
		startCounting(udata);
	}
	// We render modules by default
	renderModules(udata, CONTENT);
	renderSessCard(udata, SCARDC);
	updateUISetting(udata);

	if (udata.settings.rules.shown_tips_new === false) POPUPS.welcome();

	local.onChanged.addListener(async () => {
		const udata = await local.get(null);
		if (udata.reason.length > 0) console.log(udata);
		const reason = new Set(udata.reason);

		if (udata.inject.answered) {
			startCounting(udata);
		}

		updateUISetting(udata);
		renderSessCard(udata, SCARDC);

		if (reason.has(REASON.MODULE)) {
			renderModules(udata, CONTENT);
			renderSessCard(udata, SCARDC);
		}

		if (reason.has(REASON.UNIT)) {
			const { moduleIndex } = getIndexes(udata, currmodid);
			renderUnits(udata, moduleIndex, CONTENT);
			renderSessCard(udata, SCARDC);
		}

		if (reason.has(REASON.CARD)) {
			const { moduleIndex, unitIndex } = getIndexes(udata, currmodid, currunitid);
			renderCards(udata, moduleIndex, unitIndex, CONTENT);
			renderSessCard(udata, SCARDC);
		}

		await local.set({ reason: [] });
	});
}

async function initStorage() {
	const udata = await local.get(null);
	console.log(udata);
	if (Object.keys(udata).length === 0) {
		await local.set({
			inject: { answered: false, time: null },
			reason: [],
			modules: [],
			settings: {
				rules: {
					shown_tips_new: false,
					whitelist: "",
					learning_mode: "short",
					interval_ms: 60000 * 5,
				},
			},
		});
	}
}

function getLatestId(arr) {
	let id = 0;
	for (const i in arr) {
		if (arr[i].id > id) id = arr[i].id;
	}
	if (arr.length !== 0) id += 1;
	return id;
}

function addListenerLibrary() {
	const { getLibraryElements, getModulePopup, getUnitPopup, getCardPopup } = getElements();
	const { CONTENT, MADD, MSORT, NBACK, UADD, USORT, CADD, CSORT, CACT, MACT, UACT } = getLibraryElements();

	const { MCONT, MCONF, MCONFEDIT, MCANC, MAUTH, MDESC, MTITLE, MICON } = getModulePopup();
	const { UCONT, UCONF, UCONFEDIT, UCANC, UDESC, UICON, UTITLE } = getUnitPopup();
	const { CCONT, CCONF, CCONFEDIT, CCANC, CANS, CCHO, CQUE, CORC, QTYPE, CANSC, CCHOC, CIMG, CCORC } = getCardPopup();

	const mAddExit = () => {
		MAUTH.value = "";
		MDESC.value = "";
		MTITLE.value = "";
		MICON.value = "";
		MCONT.classList.add("no-display");
	};

	const uAddExit = () => {
		UDESC.value = "";
		UTITLE.value = "";
		UICON.value = "";
		UCONT.classList.add("no-display");
	};

	const cAddExit = () => {
		CANS.value = "";
		CCHO.value = "";
		CQUE.value = "";

		CCONT.classList.add("no-display");
		const image = CIMG.files[0];
		if (image) {
			CIMG.value = "";
		}
	};

	// MODULES

	MCONFEDIT.addEventListener("click", async () => {
		const author = MAUTH.value;
		const description = MDESC.value;
		const title = MTITLE.value;
		const icon = MICON.value;

		if (description.trim() === "" || title.trim() === "") {
			POPUPS.incomplete_input();
			return;
		}

		const udata = await local.get(null);
		// The module id is stored in MCONT element when the edit button is clicked
		// MCONT is the module add popup
		const { moduleIndex } = getIndexes(udata, parseInt(MCONT.dataset.mid));

		const module = udata.modules[moduleIndex];
		module.author = author;
		module.title = title;
		module.description = description;
		module.icon = icon;

		udata.reason.push(REASON.MODULE);

		POPUPS.complete_edit();
		await local.set(udata);
		mAddExit();
	});

	MCONF.addEventListener("click", async () => {
		const author = MAUTH.value;
		const description = MDESC.value;
		const title = MTITLE.value;
		const icon = MICON.value;

		if (description.trim() === "" || title.trim() === "") {
			POPUPS.incomplete_input();
			return;
		}

		const udata = await local.get(null);
		const { MODULE } = getStruct();

		MODULE.id = getLatestId(udata.modules);
		MODULE.author = author;
		MODULE.title = title;
		MODULE.description = description;
		MODULE.icon = icon;

		udata.modules.push(MODULE);
		udata.reason.push(REASON.MODULE);

		await local.set(udata);
		mAddExit();
	});

	// UNITS
	UCONF.addEventListener("click", async () => {
		const description = UDESC.value;
		const title = UTITLE.value;
		const icon = UICON.value;

		if (description.trim() === "" || title.trim() === "") {
			POPUPS.incomplete_input();
			return;
		}

		const udata = await local.get(null);
		// We have to use currmodid because currmodid is stored whenever the module is clicked, which is the case here
		const { moduleIndex } = getIndexes(udata, currmodid);

		const { UNIT } = getStruct();
		UNIT.id = getLatestId(udata.modules[moduleIndex].units);
		UNIT.title = title;
		UNIT.description = description;
		UNIT.icon = icon;

		udata.modules[moduleIndex].units.push(UNIT);
		udata.reason.push(REASON.UNIT);

		await local.set(udata);
		uAddExit();
	});

	UCONFEDIT.addEventListener("click", async () => {
		const description = UDESC.value;
		const title = UTITLE.value;
		const icon = UICON.value;

		if (description.trim() === "" || title.trim() === "") {
			POPUPS.incomplete_input();
			return;
		}

		const udata = await local.get(null);
		// Use the dataset from the uid that we set when we clicked on unit edit
		const { moduleIndex, unitIndex } = getIndexes(udata, currmodid, parseInt(UCONT.dataset.uid));
		const unit = udata.modules[moduleIndex].units[unitIndex];

		unit.title = title;
		unit.description = description;
		unit.icon = icon;

		udata.reason.push(REASON.UNIT);

		POPUPS.complete_edit();
		await local.set(udata);
		uAddExit();
	});

	// CARDS
	CCONF.addEventListener("click", async () => {
		const { CARD } = getStruct();

		const udata = await local.get(null);

		const { moduleIndex, unitIndex } = getIndexes(udata, currmodid, currunitid);
		CARD.id = getLatestId(udata.modules[moduleIndex].units[unitIndex].cards);

		const image = CIMG.files[0];
		if (image) {
			CARD.image = await toBase64(image);
			CIMG.value = "";
		}

		const type = parseInt(QTYPE.querySelector("input[name='qtype']:checked").value);
		switch (type) {
			case Q_TYPES.FL: {
				const question = CQUE.value;
				const answer = CANS.value;

				if (question.trim() === "" || answer.trim() === "") {
					POPUPS.incomplete_input();
					return;
				}

				CARD.question = question;
				CARD.answer = answer;
				CARD.card_type = Q_TYPES.FL;
				break;
			}
			case Q_TYPES.TF: {
				const question = CQUE.value;
				const answers = CCHO.value;
				const selected_answer = CORC.querySelector("input[name='schoice']:checked");
				const answer = selected_answer ? parseInt(selected_answer.value) : null;

				if (question.trim() === "" || answers.trim() === "" || answer == null) {
					POPUPS.incomplete_input();
					return;
				}

				CARD.question = question;
				CARD.answer = answer;
				CARD.answers = answers;
				CARD.card_type = Q_TYPES.TF;
				break;
			}
			case Q_TYPES.ID: {
				const question = CQUE.value;
				const answer = CANS.value;

				if (question.trim() === "" || answer.trim() === "") {
					POPUPS.incomplete_input();
					return;
				}

				CARD.question = question;
				CARD.answer = answer;
				CARD.card_type = Q_TYPES.ID;
				break;
			}
			case Q_TYPES.MT: {
				const question = CQUE.value;
				const answers = CCHO.value;
				const selected_answer = CORC.querySelector("input[name='schoice']:checked");
				const answer = selected_answer ? parseInt(selected_answer.value) : null;

				if (question.trim() === "" || answers.trim() === "" || answer == null) {
					POPUPS.incomplete_input();
					return;
				}

				CARD.question = question;
				CARD.answer = answer;
				CARD.answers = answers;
				CARD.card_type = Q_TYPES.MT;
				break;
			}
		}
		udata.modules[moduleIndex].units[unitIndex].cards.push(CARD);
		POPUPS.card_added();
		udata.reason.push(REASON.CARD);
		await local.set(udata);
	});

	CCONFEDIT.addEventListener("click", async () => {
		const udata = await local.get(null);
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(udata, currmodid, currunitid, parseInt(CCONT.dataset.cid));
		const card = udata.modules[moduleIndex].units[unitIndex].cards[cardIndex];

		const image = CIMG.files[0];
		if (image) {
			card.image = await toBase64(image);
			CIMG.value = "";
		}

		const type = parseInt(QTYPE.querySelector("input[name='qtype']:checked").value);
		switch (type) {
			case Q_TYPES.FL: {
				const question = CQUE.value;
				const answer = CANS.value;

				if (question.trim() === "" || answer.trim() === "") {
					POPUPS.incomplete_input();
					return;
				}

				card.question = question;
				card.answer = answer;
				card.card_type = Q_TYPES.FL;
				break;
			}
			case Q_TYPES.TF: {
				const question = CQUE.value;
				const answers = CCHO.value;
				const selected_answer = CORC.querySelector("input[name='schoice']:checked");
				const answer = selected_answer ? parseInt(selected_answer.value) : null;

				if (question.trim() === "" || answers.trim() === "" || answer == null) {
					POPUPS.incomplete_input();
					return;
				}

				card.question = question;
				card.answer = answer;
				card.answers = answers;
				card.card_type = Q_TYPES.TF;
				break;
			}
			case Q_TYPES.ID: {
				const question = CQUE.value;
				const answer = CANS.value;

				if (question.trim() === "" || answer.trim() === "") {
					POPUPS.incomplete_input();
					return;
				}

				card.question = question;
				card.answer = answer;
				card.card_type = Q_TYPES.ID;
				break;
			}
			case Q_TYPES.MT: {
				const question = CQUE.value;
				const answers = CCHO.value;
				const selected_answer = CORC.querySelector("input[name='schoice']:checked");
				const answer = selected_answer ? parseInt(selected_answer.value) : null;

				if (question.trim() === "" || answers.trim() === "" || answer == null) {
					POPUPS.incomplete_input();
					return;
				}

				card.question = question;
				card.answer = answer;
				card.answers = answers;
				card.card_type = Q_TYPES.MT;
				break;
			}
		}

		POPUPS.complete_edit();
		udata.reason.push(REASON.CARD);
		await local.set(udata);
	});

	MCANC.addEventListener("click", () => mAddExit());
	UCANC.addEventListener("click", () => uAddExit());
	CCANC.addEventListener("click", () => cAddExit());

	// Library
	QTYPE.addEventListener("click", ({ target }) => {
		if (target.id === "qtype") return;
		// To disable double click from HTML default behavior with JS where events bubbles
		if (target.nodeName === "INPUT") return;
		const button = target.closest("div[data-feature]");

		switch (button.dataset.feature) {
			case "fl": {
				CANSC.classList.remove("no-display");
				CCHOC.classList.add("no-display");
				CCORC.classList.add("no-display");
				break;
			}
			case "tf": {
				CANSC.classList.add("no-display");
				CCHOC.classList.add("no-display");
				CCORC.classList.remove("no-display");
				CORC.innerHTML = "";
				CCHO.value = "True,False";
				renderChoices(CCHO, CORC);
				break;
			}
			case "id": {
				CANSC.classList.remove("no-display");
				CCHOC.classList.add("no-display");
				CCORC.classList.add("no-display");
				break;
			}
			case "mt": {
				CANSC.classList.add("no-display");
				CCHOC.classList.remove("no-display");
				CCORC.classList.remove("no-display");
				CORC.innerHTML = "";
				CCHO.value = "";
				break;
			}
		}
	});

	NBACK.addEventListener("click", async () => {
		const udata = await local.get(null);
		if (currnav === NAVIGATION.UNITS) {
			currnav = NAVIGATION.MODULES;

			NBACK.classList.add("no-display");
			MACT.classList.remove("no-display");
			UACT.classList.add("no-display");
			CACT.classList.add("no-display");

			renderModules(udata, CONTENT);
		} else if (currnav === NAVIGATION.CARDS) {
			currnav = NAVIGATION.UNITS;

			MACT.classList.add("no-display");
			UACT.classList.remove("no-display");
			CACT.classList.add("no-display");

			const { moduleIndex } = getIndexes(udata, currmodid);
			renderUnits(udata, moduleIndex, CONTENT);
		}
	});

	MADD.addEventListener("click", () => {
		const mconf = MCONT.querySelector("#mconf");
		const mconfedit = MCONT.querySelector("#mconfedit");
		const title = MCONT.querySelector(".title");
		title.textContent = "Add New Module";
		mconf.classList.remove("no-display");
		mconfedit.classList.add("no-display");
		MCONT.classList.remove("no-display");
	});

	UADD.addEventListener("click", () => {
		const uconf = UCONT.querySelector("#uconf");
		const uconfedit = UCONT.querySelector("#uconfedit");
		const title = UCONT.querySelector(".title");
		title.textContent = "Add New Unit";
		uconf.classList.remove("no-display");
		uconfedit.classList.add("no-display");
		UCONT.classList.remove("no-display");
	});

	CADD.addEventListener("click", () => {
		const title = CCONT.querySelector(".title");
		title.textContent = "Add New Card";
		CCONF.classList.remove("no-display");
		CCONFEDIT.classList.add("no-display");
		CCONT.classList.remove("no-display");
	});

	CCHO.addEventListener("input", () => renderChoices(CCHO, CORC));

	MSORT.addEventListener("click", () => {
		alert(1);
	});

	USORT.addEventListener("click", () => {
		alert(1);
	});

	CSORT.addEventListener("click", () => {
		alert(1);
	});
}

function addListenerSettingSide() {
	const { getSettingsSide, getSettingsBody } = getElements();
	const y = getSettingsBody();
	const x = getSettingsSide();

	for (const i in x) {
		x[i].addEventListener("click", () => {
			for (const j in y) {
				if (i === j) {
					y[j].classList.remove("no-display");
					continue;
				}
				y[j].classList.add("no-display");
			}
		});
	}
}

// Utilities

function makeCards(cards) {
	if (cards.length === 0) return;
	const element = document.createDocumentFragment();
	for (const i in cards) {
		element.append(makeCard(cards[i]));
	}
	return element;
}

function makeCard(data) {
	// I should also display the time they'll appear next
	const card_type = Array.from(["Flashcard", "True or False", "Identification", "Multiple Choice"])[data.card_type];
	const is_choices = data.card_type === Q_TYPES.MT || data.card_type === Q_TYPES.TF;
	const element = create_element("div", { class: `module card`, dataset: { id: data.id } }, [
		`
	<div class="settings">
		<button data-feature="edit">
			<svg><use href="#edit" /></svg>
		</button>
		<button data-feature="delete">
			<svg><use href="#delete" /></svg>
		</button>
	</div>
	<div class="information">
		<div class="question">
			<p>Question: </p>
			<p class="card_question">${data.question}</p>
		</div>
		<div class="answers ${is_choices ? "" : "no-display"}">
			<p>Choices: </p>
			<p class="card_question">${is_choices ? data.answers.replaceAll(/,/g, "&nbsp , &nbsp") : ""}</p>
		</div>
		<div class="answer">
			<p>Answer: </p>
			<p class="card_question">${is_choices ? data.answers.split(",")[data.answer] : data.answer}</p>
		</div>
		<span class="hline hspacetop"></span>
		<div class="meta">
			<p> ${data.level > 5 ? "Done" : "Level: " + data.level}</p>
			<p>Next: ${dateToYYYYMMDD(new Date(data.next_review))}</p>
		</div>
		<span class="hline"></span>
		<div class="meta">
			<p class="cardtype">${card_type}</p>
			<p class="date">${dateToYYYYMMDD(new Date(data.created_at))}</p>
		</div>
	</div>`,
	]);

	element.querySelector(".settings").addEventListener("click", async ({ target }) => {
		if (target.nodeName === "DIV") return;
		const button = target.closest("button");

		const udata = await local.get(null);
		switch (button.dataset.feature) {
			case "edit": {
				const { CANS, CQUE, CCHO, CCONT, CCONF, CCONFEDIT, QTYPE, CORC } = getElements().getCardPopup();
				const title = CCONT.querySelector(".title");

				QTYPE.querySelectorAll("label")[data.card_type].click();

				CQUE.value = data.question;
				CANS.value = data.answer;
				CCHO.value = data.answers;

				title.textContent = "Edit Card";
				CCONT.dataset.cid = data.id;

				CCONF.classList.add("no-display");
				CCONFEDIT.classList.remove("no-display");
				CCONT.classList.remove("no-display");
				break;
			}
			case "delete": {
				const { moduleIndex, unitIndex, cardIndex } = getIndexes(udata, currmodid, currunitid, data.id);
				udata.modules[moduleIndex].units[unitIndex].cards.splice(cardIndex, 1);
				udata.reason.push(REASON.CARD);
				await local.set(udata);
				break;
			}
		}
	});

	return element;
}

function makeUnits(units) {
	if (units.length === 0) return;
	const element = document.createDocumentFragment();
	for (const i in units) {
		element.append(makeUnit(units[i]));
	}
	return element;
}

function makeUnit(data) {
	const element = create_element("div", { class: `module ${!data.is_active ? "inactive" : ""}`, dataset: { id: data.id } }, [
		`
	<div class="settings">
		<button data-feature="edit">
			<svg><use href="#edit" /></svg>
		</button>
		<button data-feature="delete">
			<svg><use href="#delete" /></svg>
		</button>
		<button data-feature="togglestate">
			<svg><use href="#togglestate" /></svg>
		</button>
	</div>
	<div class="information">
		<div class="header">
			<p class="title">${data.title}</p>
			<span class="hspacetop"></span>
			<p class="description">${data.description}</p>
		</div>
		<div class="meta">
			<!-- This should be an image -->
			<button class="icon">${data.icon}</button>
			<p class="date">${dateToYYYYMMDD(new Date(data.created_at))}</p>
			<p class="data">${data.cards.length} Cards</p>
		</div>
	</div>`,
	]);

	element.addEventListener("click", async ({ target }) => {
		if (target.closest(".settings")) return;
		const udata = await local.get(null);
		const { CONTENT, MACT, UACT, CACT, NBACK } = getElements().getLibraryElements();

		currnav = NAVIGATION.CARDS;
		currunitid = data.id;
		const { moduleIndex, unitIndex } = getIndexes(udata, currmodid, currunitid);

		MACT.classList.add("no-display");
		CACT.classList.remove("no-display");
		NBACK.classList.remove("no-display");
		UACT.classList.add("no-display");

		renderCards(udata, moduleIndex, unitIndex, CONTENT);
	});

	element.querySelector(".settings").addEventListener("click", async ({ target }) => {
		if (target.nodeName === "DIV") return;
		const button = target.closest("button");

		const udata = await local.get(null);
		switch (button.dataset.feature) {
			case "edit": {
				const { UCONT, UDESC, UTITLE, UICON, UCONF, UCONFEDIT } = getElements().getUnitPopup();
				const title = UCONT.querySelector(".title");

				UICON.value = data.icon;
				UTITLE.value = data.title;
				UDESC.value = data.description;

				title.textContent = "Edit Unit";
				UCONT.dataset.uid = data.id;

				UCONF.classList.add("no-display");
				UCONFEDIT.classList.remove("no-display");
				UCONT.classList.remove("no-display");
				break;
			}
			case "delete": {
				const { moduleIndex, unitIndex } = getIndexes(udata, currmodid, data.id);
				udata.modules[moduleIndex].units.splice(unitIndex, 1);
				udata.reason.push(REASON.UNIT);
				await local.set(udata);
				break;
			}
			case "togglestate": {
				const { moduleIndex, unitIndex } = getIndexes(udata, currmodid, data.id);
				udata.modules[moduleIndex].units[unitIndex].is_active = !udata.modules[moduleIndex].units[unitIndex].is_active;
				udata.reason.push(REASON.UNIT);
				await local.set(udata);
				break;
			}
		}
	});
	return element;
}

function makeModules(modules) {
	if (modules.length === 0) return;
	const element = document.createDocumentFragment();
	for (const i in modules) {
		element.append(makeModule(modules[i]));
	}
	return element;
}

function makeModule(data) {
	const cards_count = data.units.reduce((sum, unit) => sum + unit.cards.length, 0);
	const element = create_element("div", { class: `module ${!data.is_active ? "inactive" : ""}`, dataset: { id: data.id } }, [
		`
	<div class="settings">
		<button data-feature="edit">
			<svg><use href="#edit" /></svg>
		</button>
		<button data-feature="delete">
			<svg><use href="#delete" /></svg>
		</button>
		<button data-feature="togglestate">
			<svg><use href="#togglestate" /></svg>
		</button>
	</div>
	<div class="information">
		<div class="header">
			<p class="title">${data.title}</p>
			<span class="hspacetop"></span>
			<p class="description">${data.description}</p>
		</div>
		<div class="meta">
			<!-- This should be an image -->
			<button class="icon">${data.icon}</button>
			<p class="author">${data.author}</p>
			<p class="date">${dateToYYYYMMDD(new Date(data.created_at))}</p>
			<p class="data">${data.units.length} Units - ${cards_count} Cards</p>
		</div>
	</div>`,
	]);

	element.addEventListener("click", async ({ target }) => {
		if (target.closest(".settings")) return;
		const udata = await local.get(null);
		const { CONTENT, MACT, UACT, CACT, NBACK } = getElements().getLibraryElements();

		// Since we entered a module, we have to store the module id to render its units
		currnav = NAVIGATION.UNITS;
		currmodid = data.id;
		const { moduleIndex } = getIndexes(udata, currmodid);

		MACT.classList.add("no-display");
		CACT.classList.add("no-display");
		NBACK.classList.remove("no-display");
		UACT.classList.remove("no-display");

		renderUnits(udata, moduleIndex, CONTENT);
	});

	element.querySelector(".settings").addEventListener("click", async ({ target }) => {
		if (target.nodeName === "DIV") return;
		const button = target.closest("button");

		const udata = await local.get(null);
		switch (button.dataset.feature) {
			case "edit": {
				const { MCONT, MAUTH, MDESC, MTITLE, MICON } = getElements().getModulePopup();
				const mconf = MCONT.querySelector("#mconf");
				const mconfedit = MCONT.querySelector("#mconfedit");
				const title = MCONT.querySelector(".title");

				MICON.value = data.icon;
				MTITLE.value = data.title;
				MDESC.value = data.description;
				MAUTH.value = data.author;

				title.textContent = "Edit Module";
				mconf.classList.add("no-display");
				mconfedit.classList.remove("no-display");
				MCONT.dataset.mid = data.id;
				MCONT.classList.remove("no-display");
				break;
			}
			case "delete": {
				const { moduleIndex } = getIndexes(udata, data.id);
				udata.modules.splice(moduleIndex, 1);
				udata.reason.push(REASON.MODULE);
				await local.set(udata);
				break;
			}
			case "togglestate": {
				const { moduleIndex } = getIndexes(udata, data.id);
				udata.modules[moduleIndex].is_active = !udata.modules[moduleIndex].is_active;
				udata.reason.push(REASON.MODULE);
				await local.set(udata);
				break;
			}
		}
	});
	return element;
}

function updatePath(page, path) {
	const { CURRPAGE, CURRPATH } = getElements().getLibraryElements();
	CURRPAGE.innerText = page;
	CURRPATH.innerText = path;
}
