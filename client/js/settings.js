import { show_popup } from "./utilities.js";
import { getElements } from "./elements.js";
import { REASON } from "./struct.js";

const browser = window.browser || window.chrome;
const local = browser.storage.local;

const POPUPS = {
	set_complete: () =>
		show_popup({
			block_outside: true,
			title: "Successfully set",
			description: "You successfully changed the value of the setting!",
			icon: '<svg><use href="#check"/></svg>',
			action: "Okay",
			width: 30,
			bg_color: "hsl(0, 0%, 10%)",
			text_color: "hsl(0, 0%, 90%)",
		}),
};

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
		POPUPS.set_complete();

		udata.reason.push(REASON.SETTING);
		await local.set(udata);
	});

	SRADIO.addEventListener("click", async () => {
		const udata = await local.get(null);
		udata.settings.rules.learning_mode = "short";
		POPUPS.set_complete();

		udata.reason.push(REASON.SETTING);
		await local.set(udata);
	});

	INTBTN.addEventListener("click", async () => {
		const udata = await local.get(null);
		udata.settings.rules.interval_ms = minToMs(INTERVALMS.value);
		POPUPS.set_complete();

		udata.reason.push(REASON.SETTING);
		await local.set(udata);
	});

	WHLBTN.addEventListener("click", async () => {
		const udata = await local.get(null);
		udata.settings.rules.whitelist = WHITELIST.value;
		POPUPS.set_complete();
		udata.reason.push(REASON.SETTING);
		await local.set(udata);
	});
}

export function minToMs(min) {
	return min * 1000 * 60;
}

export function msToMin(ms) {
	if (ms === 0) return 0;
	return ms / 1000 / 60;
}
