import { getRegex } from "./regex.js";
import { getElements } from "./elements.js";
import { getLatestId, POPUPS, show_popup } from "./utilities.js";
import { getStruct, Q_TYPES, REASON } from "./struct.js";

const browser = window.browser || window.chrome;
const local = browser.storage.local;

export function addListenerParse() {
	const { GENERATE, UPROMPT } = getElements().getNoteElements();

	GENERATE.addEventListener("click", async () => {
		const prompt = UPROMPT.value.trim();
		const module = parsePrompt(prompt);
		if (prompt === "" || module == null) {
			POPUPS.incomplete_input();
			return;
		}
		const udata = await local.get(null);
		module.id = getLatestId(udata.modules);

		POPUPS.card_added();

		udata.modules.push(module);
		udata.reason.push(REASON.MODULE);
		udata.reason.push(REASON.UNIT);
		udata.reason.push(REASON.CARD);
		udata.reason.push(REASON.SCARD);
		await local.set(udata);
	});
}

export function parsePrompt(str) {
	if (str == null || str === "") return;
	const prompt = str.replaceAll(/\\n/g, " ").replaceAll(/\s+/g, " ");
	console.log(prompt);
	const { MODULE } = getStruct();
	const { fl, id, module_info, mt, tf, unit_info, units_grabber } = getRegex().getPromptParser();

	const minfo = prompt.matchAll(module_info);
	for (const i of minfo) {
		console.log(i);
		if (i[0].includes("-mtitle")) MODULE.title = i[1];
		if (i[0].includes("-mdesc")) MODULE.description = i[2];
		if (i[0].includes("-micon")) MODULE.icon = i[3];
	}

	let uindex = 0;
	const ugrab = prompt.matchAll(units_grabber);
	for (const i of ugrab) {
		const { UNIT } = getStruct();
		UNIT.id = uindex;
		const uinfo = i[1].matchAll(unit_info);
		for (const j of uinfo) {
			if (j[0].includes("-utitle")) UNIT.title = j[1];
			if (j[0].includes("-udesc")) UNIT.description = j[2];
			if (j[0].includes("-uicon")) UNIT.icon = j[3];
		}

		let cindex = 0;
		const fls = i[1].matchAll(fl);
		for (const j of fls) {
			const { CARD } = getStruct();
			CARD.id = cindex;
			CARD.card_type = Q_TYPES.FL;
			CARD.question = j[1];
			CARD.answer = j[2];
			cindex += 1;
			UNIT.cards.push(CARD);
		}
		const ids = i[1].matchAll(id);
		for (const j of ids) {
			const { CARD } = getStruct();
			CARD.id = cindex;
			CARD.card_type = Q_TYPES.ID;
			CARD.question = j[1];
			CARD.answer = j[2];
			cindex += 1;
			UNIT.cards.push(CARD);
		}
		const tfs = i[1].matchAll(tf);
		for (const j of tfs) {
			const { CARD } = getStruct();
			CARD.id = cindex;
			CARD.card_type = Q_TYPES.TF;
			CARD.question = j[1];
			CARD.answers = "True,False";
			CARD.answer = j[2].includes("T") ? 0 : 1;
			cindex += 1;
			UNIT.cards.push(CARD);
		}
		const mts = i[1].matchAll(mt);
		for (const j of mts) {
			const { CARD } = getStruct();
			CARD.id = cindex;
			CARD.card_type = Q_TYPES.MT;
			CARD.question = j[1];
			CARD.answers = j[2];
			CARD.answer = parseInt(j[3]);
			cindex += 1;
			UNIT.cards.push(CARD);
		}
		uindex += 1;
		MODULE.units.push(UNIT);
	}
	if (MODULE.units.length === 0) {
		POPUPS.incomplete_input();
		return;
	}

	return MODULE;
}
