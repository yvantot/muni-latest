import { getElements } from "./elements.js";

const browser = window.browser || window.chrome;
const local = browser.storage.local;

export function updateUISetting(udata) {
	const { getSettingElements } = getElements();
	const { LRADIO, SRADIO, INTERVALMS, WHITELIST } = getSettingElements();

	if (udata.settings.rules.learning_mode === "long") LRADIO.checked = true;
	if (udata.settings.rules.learning_mode === "short") SRADIO.checked = true;

	INTERVALMS.value = msToMin(udata.settings.rules.interval_ms);
	WHITELIST.value = udata.settings.rules.whitelist;
}

export function addListenerSetting() {
	const { getSettingElements } = getElements();
	const { INTBTN, WHLBTN, LRADIO, SRADIO, INTERVALMS, WHITELIST } = getSettingElements();

	LRADIO.addEventListener("click", async () => {
		const udata = await local.get(null);
		udata.settings.rules.learning_mode = "long";
		await local.set(udata);
	});

	SRADIO.addEventListener("click", async () => {
		const udata = await local.get(null);
		udata.settings.rules.learning_mode = "short";
		await local.set(udata);
	});

	INTBTN.addEventListener("click", async () => {
		const udata = await local.get(null);
		udata.settings.rules.interval_ms = minToMs(INTERVALMS.value);
		await local.set(udata);
	});

	WHLBTN.addEventListener("click", async () => {
		const udata = await local.get(null);
		udata.settings.rules.whitelist = WHITELIST.value;
		await local.set(udata);
	});
}

function minToMs(min) {
	return min * 1000 * 60;
}

function msToMin(ms) {
	if (ms === 0) return 0;
	return ms / 1000 / 60;
}
