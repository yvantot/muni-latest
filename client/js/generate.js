import { getElements } from "./elements.js";
import { Q_TYPES, PARSE, REASON } from "./struct.js";
import { POPUPS, getLatestId } from "./utilities.js";
import { parsePrompt } from "./parse.js";

const browser = window.browser || window.chrome;
const local = browser.storage.local;

export function addListenerGenerate() {
	const { CCOUNT, GENERATE, GPTSOURCE, GEMINISOURCE, QTYPE, UCOUNT, UPROMPT } = getElements().getGenerateElements();

	GENERATE.addEventListener("click", async () => {
		const types = [];
		const ccount = parseInt(CCOUNT.value);
		const ucount = parseInt(UCOUNT.value);
		const uprompt = UPROMPT.value.trim().replaceAll(/\s+/g, " ");
		QTYPE.querySelectorAll("input").forEach((i) => {
			if (i.checked) {
				types.push(parseInt(i.value));
			}
		});

		if (uprompt === "" || types.length === 0) {
			POPUPS.incomplete_input();
			return;
		}

		POPUPS.generating();

		const prompt = buildPrompt(uprompt, ucount, ccount, types);
		console.log(prompt);

		if (GPTSOURCE.checked) {
			response = await scrapeChatGPT(prompt);
		} else if (GEMINISOURCE.checked) {
			response = await scrapeGemini(prompt);
		}
	});
}

async function scrapeChatGPT(prompt) {
	const { height } = window.screen;
	const win = await browser.windows.create({ left: 0, focused: true, type: "popup", width: 300, height, left: 0, top: 0, url: "https://chatgpt.com/?model=auto&temporary-chat=true&popapp=true" });
	const id = win.id;
	const tab_id = win.tabs[0].id;

	// Check if its loaded
	const x = setInterval(() => {
		browser.tabs.sendMessage(tab_id, { message: "is-loaded" }, (response) => {
			console.log(response);
			if (response.status === true) {
				console.log("LOADED");
				clearInterval(x);
				setTimeout(
					() =>
						browser.tabs.sendMessage(tab_id, { message: "scrape-gpt", prompt, id }, async (response) => {
							browser.windows.remove(id);
							const module = parsePrompt(response.data);
							const udata = await local.get(null);
							module.id = getLatestId(udata.modules);

							POPUPS.card_added();

							udata.modules.push(module);

							udata.reason.push(REASON.MODULE);
							udata.reason.push(REASON.UNIT);
							udata.reason.push(REASON.CARD);
							udata.reason.push(REASON.SCARD);
							await local.set(udata);
						}),
					1000
				);
			}
		});
	}, 1000);
}

async function scrapeGemini() {
	return true;
}

export function buildPrompt(ustr, unit_count, card_count, q_types) {
	let prompt = `
    Make me ${unit_count} unit with ${card_count} card each with this format.
    There can only be one module. Don't close them like HTML tag, it'll ruin the format.
    Output it as plain text, no formatting, no interactives and no testing of new features, just the raw text.
    
    ${PARSE.module} 
    ${PARSE.unit}
    ${q_types.includes(Q_TYPES.FL) ? PARSE.fl : ""}
    ${q_types.includes(Q_TYPES.TF) ? PARSE.tf : ""}
    ${q_types.includes(Q_TYPES.ID) ? PARSE.id : ""}
    ${q_types.includes(Q_TYPES.MT) ? PARSE.mt : ""}
    ${PARSE.unit}
    ... Continue

    The context for the topic I want you to create is: ${ustr}
    `;
	return prompt.replaceAll(/[\s]+/g, " ");
}
