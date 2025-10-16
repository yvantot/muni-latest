import { Q_TYPES, REASON } from "./struct.js";

import { create_element, getIndexes, sanitizeHTML } from "./utilities.js";

const browser = window.browser || window.chrome;
const local = browser.storage.local;

const SCHED_MODE = {
	SHORT: 0,
	LONG: 1,
};

function setCards(udata) {
	const CARDS = {
		1: [],
		2: [],
		3: [],
		4: [],
		5: [],
	};
	const { modules } = udata;
	if (modules.length === 0) return null;

	const cards = [];
	for (const i of modules) {
		if (i.is_active) {
			for (const j of i.units) {
				if (j.is_active) {
					for (const k of j.cards) {
						k.mid = i.id;
						k.uid = j.id;
						cards.push(k);
					}
				}
			}
		}
	}

	cards.forEach((i) => {
		if (i.level <= 5) CARDS[i.level].push(i);
	});

	return CARDS;
}

function getCard(udata) {
	const cards = setCards(udata);
	if (cards == null) return;

	let has_card = false;
	for (const i of Object.keys(cards)) {
		if (cards[i].length > 0) has_card = true;
	}

	if (has_card == false) return null;

	const mode = udata.settings.rules.learning_mode === "short" ? SCHED_MODE.SHORT : SCHED_MODE.LONG;

	if (mode === SCHED_MODE.SHORT) {
		const level_one_chance = cards[1].length ? new Array(3 * cards[1].length).fill(1) : [];
		const level_two_chance = cards[2].length ? new Array(2 * cards[2].length).fill(2) : [];
		const level_three_chance = cards[3].length ? new Array(cards[3].length).fill(3) : [];
		const level_four_chance = cards[4].length ? new Array(cards[4].length).fill(4) : [];
		const level_five_chance = cards[5].length ? new Array(cards[5].length).fill(5) : [];

		const probability = [level_one_chance, level_two_chance, level_three_chance, level_four_chance, level_five_chance].flat();
		const get_random_level = probability[Math.floor(Math.random() * probability.length)];

		const card = cards[get_random_level][0] != null ? cards[get_random_level][0] : null;

		return card;
	} else if (mode === SCHED_MODE.LONG) {
		for (let i = 0; i < udata.modules.length; i++) {
			if (udata.modules[i].is_active === false) continue;

			const units = udata.modules[i].units;
			for (let j = 0; j < units.length; j++) {
				if (units[j].is_active === false) continue;

				const cards = units[j].cards;
				const now = new Date();
				for (let k = 0; k < cards.length; k++) {
					const card = cards[k];
					if (now >= new Date(card.next_review)) {
						return card;
					}
				}
			}
		}
		return null;
	}
}

export function renderSessCard(udata, parent) {
	const card = getCard(udata);
	parent.innerHTML = "";
	if (udata.inject.answered) return;
	if (card) {
		parent.append(makeSessCard(card, udata));
	}
}

function makeSessCard(data, udata) {
	const is_choice = data.card_type === Q_TYPES.MT || data.card_type === Q_TYPES.TF;
	const mode = udata.settings.rules.learning_mode === "short" ? SCHED_MODE.SHORT : SCHED_MODE.LONG;

	function choice(href) {
		if (href.includes("#")) return `<div class="uchoice"><svg><use href="${href}"/></svg></div>`;
		return `<div class="uchoice">${href}</div>`;
	}

	let mt_choices = "";
	if (data.card_type === Q_TYPES.MT) {
		const choices = data.answers.split(",");
		for (const i in choices) {
			mt_choices += choice(sanitizeHTML(choices[i]));
		}
	}

	const element = create_element("div", { class: "scard" }, [
		`
        ${mode === SCHED_MODE.SHORT ? `<p class="level">Level: ${data.level}</p>` : `<p class="level">Repetition: ${data.repetitions}</p>`}
        ${data.image ? `<div class="cimage"><img src="${data.image}"/></div>` : ""}
        <p class="question">${sanitizeHTML(data.question)}</p>
        <p class="no-display answer">${is_choice ? sanitizeHTML(data.answers).split(",")[data.answer] : sanitizeHTML(data.answer)}</p>

        <div class="answer-container" data-answer="${data.answer}">
            ${data.card_type === Q_TYPES.FL ? `<div class="choices" id="user-answer">${choice("Don't know")}${choice("Familiar")}${choice("Correct")}${choice("Easy")}</div>` : ""} 
            ${data.card_type === Q_TYPES.TF ? `<div class="choices" id="user-answer">${choice("True")}${choice("False")}</div>` : ""} 
            ${data.card_type === Q_TYPES.ID ? `<input autocomplete="off" type="text" id="user-answer" placeholder="Press enter to confirm answer"/>` : ""} 
            ${data.card_type === Q_TYPES.MT ? `<div class="choices" id="user-answer">${mt_choices}</div>` : ""} 
        </div>`,
	]);
	const question = element.querySelector(".question");
	const answer = element.querySelector(".answer");
	const choices = element.querySelector(".choices");
	const input = element.querySelector("input");

	function wrong_answer() {
		element.classList.add("wrongans");
	}

	function correct_answer() {
		element.classList.add("correctans");
	}

	if (data.card_type === Q_TYPES.ID) {
		element.addEventListener("click", ({ target }) => {
			if (target.closest("input")) return;
			question.classList.toggle("no-display");
			answer.classList.toggle("no-display");
		});

		input.addEventListener("keydown", async (e) => {
			if (e.key === "Enter") {
				const udata = await local.get(null);
				const { moduleIndex, unitIndex, cardIndex } = getIndexes(udata, data.mid, data.uid, data.id);
				const card = udata.modules[moduleIndex].units[unitIndex].cards[cardIndex];
				const canswer = card.answer.toLowerCase().trim();
				const answer = input.value.toLowerCase().trim();
				if (mode === SCHED_MODE.SHORT) {
					if (canswer == answer) {
						card.level = Math.min(card.level + 2, 10);
						correct_answer();
					} else {
						card.level = Math.max(card.level - 1, 1);
						wrong_answer();
					}
				} else if (mode === SCHED_MODE.LONG) {
					if (canswer == answer) {
						card.repetitions += 1;
						if (card.repetitions === 1) {
							card.interval = 1;
						} else if (card.repetitions === 2) {
							card.interval = 3;
						} else {
							card.interval = Math.round(card.interval * card.easiness);
						}
						card.easiness = Math.max(1.3, card.easiness + (0.1 - (4 - (2 - 1)) * (0.08 + (4 - (2 - 1)) * 0.02)));
						correct_answer();
					} else {
						card.repetitions = 0;
						card.interval = 1;
						card.easiness = Math.max(1.3, card.easiness - 0.2);
						wrong_answer();
					}
					card.next_review = calculate_next_review(card.interval);
				}

				udata.inject.answered = true;
				udata.inject.time = String(new Date());

				udata.reason.push(REASON.CARD);
				udata.reason.push(REASON.SCARD);
				setTimeout(async () => await local.set(udata), 500);
			}
		});
	}

	if (data.card_type === Q_TYPES.TF || data.card_type === Q_TYPES.MT) {
		element.addEventListener("click", ({ target }) => {
			if (target.closest(".choices")) return;
			question.classList.toggle("no-display");
			answer.classList.toggle("no-display");
		});

		choices.addEventListener("click", async ({ target }) => {
			const increment = data.card_type === Q_TYPES.MT ? 1 : 2;
			const choice = target.closest(".uchoice");
			if (choice == null) return;

			let index = 0;
			for (const i of choices.children) {
				if (i === choice) break;
				index += 1;
			}

			const udata = await local.get(null);
			const { moduleIndex, unitIndex, cardIndex } = getIndexes(udata, data.mid, data.uid, data.id);
			const card = udata.modules[moduleIndex].units[unitIndex].cards[cardIndex];

			if (mode === SCHED_MODE.SHORT) {
				if (index === data.answer) {
					card.level = Math.min(card.level + increment, 10);
					correct_answer();
				} else {
					card.level = 1;
					wrong_answer();
				}
			} else if (mode === SCHED_MODE.LONG) {
				if (index === data.answer) {
					card.repetitions += 1;
					if (card.repetitions === 1) {
						card.interval = 1;
					} else if (card.repetitions === 2) {
						card.interval = 3;
					} else {
						card.interval = Math.round(card.interval * card.easiness);
					}
					card.easiness = Math.max(1.3, card.easiness + (0.1 - (4 - (2 - 1)) * (0.08 + (4 - (2 - 1)) * 0.02)));
					correct_answer();
				} else {
					card.repetitions = 0;
					card.interval = 1;
					card.easiness = Math.max(1.3, card.easiness - 0.2);
					wrong_answer();
				}
				card.next_review = calculate_next_review(card.interval);
			}

			udata.inject.answered = true;
			udata.inject.time = String(new Date());

			udata.reason.push(REASON.CARD);
			udata.reason.push(REASON.SCARD);
			setTimeout(async () => await local.set(udata), 500);
		});
	}

	if (data.card_type === Q_TYPES.FL) {
		element.addEventListener("click", ({ target }) => {
			if (target.closest(".choices")) return;
			question.classList.toggle("no-display");
			answer.classList.toggle("no-display");
		});

		choices.addEventListener("click", async ({ target }) => {
			const choice = target.closest(".uchoice");
			if (choice == null) return;

			const udata = await local.get(null);
			const { moduleIndex, unitIndex, cardIndex } = getIndexes(udata, data.mid, data.uid, data.id);
			const card = udata.modules[moduleIndex].units[unitIndex].cards[cardIndex];

			let index = 0;
			for (const i of choices.children) {
				if (i === choice) break;
				index += 1;
			}

			if (mode === SCHED_MODE.SHORT) {
				if (index === 0) card.level = 1;
				if (index === 1) card.level = Math.max(card.level - 1, 1);
				if (index === 2) card.level = Math.min(card.level + 1, 10);
				if (index === 3) card.level = Math.min(card.level + 2, 10);
			} else if (mode === SCHED_MODE.LONG) {
				if (index === 0) {
					card.repetitions = 0;
					card.interval = 1;
					card.easiness = Math.max(1.3, card.easiness - 0.2);
				} else {
					card.repetitions += 1;
					if (card.repetitions === 1) {
						card.interval = 1;
					} else if (card.repetitions === 2) {
						card.interval = 3;
					} else {
						card.interval = Math.round(card.interval * card.easiness);
					}
					card.easiness = Math.max(1.3, card.easiness + (0.1 - (4 - (index - 1)) * (0.08 + (4 - (index - 1)) * 0.02)));
				}

				card.next_review = calculate_next_review(card.interval);
			}

			udata.inject.answered = true;
			udata.inject.time = String(new Date());

			udata.reason.push(REASON.CARD);
			udata.reason.push(REASON.SCARD);
			await local.set(udata);
		});
	}
	return element;
}

function calculate_next_review(interval) {
	const now = new Date();
	const next_review_date = new Date(now);
	next_review_date.setDate(now.getDate() + interval);
	return next_review_date.toISOString();
}
