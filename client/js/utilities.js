export function show_popup(config = {}, callback = null) {
	document.getElementById("yvan-popup")?.remove();
	document.getElementById("yvan-popup-style")?.remove();

	const root = document.createElement("yvan-popup");
	root.setAttribute("id", "yvan-popup");

	const style = document.createElement("style");
	style.setAttribute("id", "yvan-popup-style");

	const { exitable = false, block_outside = false, title = "Attention", description = "", icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"/></svg>', action = "Okay", choices = [], bg_color = "hsl(0, 0%, 90%)", text_color = "hsl(0, 0%, 10%)", width = 50, height = undefined } = config;

	const choices_el = choices.map((choice, i) => `<input type="radio" name="choices" id="choice-${i}" value='${i}'/><label for="choice-${i}">${choice}</label>`).join("");

	style.innerHTML = `
	${
		block_outside
			? `
	yvan-popup { 
		position: fixed; 		
		width: 100vw; 
		height: 100vh;
		left: 0;
		top: 0;
		backdrop-filter: blur(5px);
		}`
			: ""
	}
	${block_outside ? "popup-main" : "yvan-popup"}{position:fixed;width:${width ? width + "vw" : "fit-content"};height:${height ? height + "vh" : "fit-content"};
	animation:show_up 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;background-color:${bg_color};a,p,button,h1,label{color:${text_color}}border-top:2px solid hsl(0 0% 50% / .5);top:50%;left:50%;transform:translateX(-50%) translateY(-50%);display:flex;flex-direction:column;justify-content:center;align-items:center;border-radius:1rem;gap:.5rem;padding:1rem;box-shadow:0 5px 10px 5px hsl(0 0% 0% / .5);z-index:999;backdrop-filter:blur(5px);p,a,button,label{font-size:clamp(0.8rem, 1vw, 1rem);user-select:none}.header{display:flex;justify-content:center;align-items:center;gap:1rem;h1{user-select:none;font-size:clamp(1rem, 1.3rem, 1.5rem);font-weight:700}svg{border-radius:100%;width:10vw;height:10vw}}.choices{background-color:hsl(0 0% 0% / .1);width:100%;display:flex;flex-direction:column;align-items:center;padding:.5rem;border-radius:.5rem;gap:.5rem;label{opacity:.5;width:100%;background-color:hsl(0 0% 50% / .5);border:1px solid hsl(0 0% 50% / .5);text-align:center;padding:.1rem .7rem;border-radius:.5rem}input{display:none}input[type="radio"]:checked+label{opacity:1;background-color:hsl(0 0% 0% / .2)}}button{width:100%;border:1px solid hsl(0 0% 50% / .5);padding:.3rem .7rem;border-radius:.5rem}button,label,span svg{cursor:pointer;transition:transform 0.3s ease-in-out,background-color 0.3s ease-in-out,opacity 0.3s ease-in-out}button:hover,label:hover{opacity:1;background-color:hsl(0 0% 0% / .1);transform:scale(.95,.95)}}
		span { position: relative; width: 100%; height: 0; svg { width: 5vw; height: 5vw;  position: absolute; top: 0; right: 0;}}
	`;

	style.innerHTML += "button { aspect-ratio: initial !important }";

	root.innerHTML = `		
		${exitable ? `<span><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg></span>` : ""}
		<div class="header">
			${icon}
			<h1>${title}</h1>
		</div>
		${description.trim().length ? `<p>${description}</p>` : ""}
		${choices_el.length ? `<div class="choices">${choices_el}</div>` : ""}
		<button>${action}</button>		
		
	`;

	if (block_outside) {
		const main = document.createElement("popup-main");
		main.innerHTML = root.innerHTML;
		root.innerHTML = "";
		root.appendChild(main);
	}

	if (exitable) {
		root.querySelector("span svg").addEventListener("click", () => {
			root.remove();
			style.remove();
		});
	}

	root.querySelector("button").addEventListener("click", () => {
		const input = root.querySelector("input[type='radio']:checked");
		if (!input && choices_el.length) return;
		const choice = input?.value ?? -1;

		root.remove();
		style.remove();

		if (callback) callback(parseInt(choice));
	});

	document.head.appendChild(style);
	document.body.appendChild(root);
}

export function create_element(name, attr = {}, inner = []) {
	const { shadow = false, namespace = null } = attr;

	let host = null;

	let element;
	if (namespace === "svg") element = document.createElementNS("http://www.w3.org/2000/svg", name);
	else element = document.createElement(name);

	if (!namespace && element instanceof HTMLUnknownElement) throw new Error(`${element} is not a valid HTML tag`);

	if (shadow) host = element.attachShadow({ mode: "open" });

	if (inner.length && typeof inner === "object") {
		for (let node of inner) {
			if (typeof node === "string") {
				if (shadow) host.innerHTML += node.trim();
				else element.innerHTML += node.trim();
			} else if (node instanceof HTMLElement) {
				if (shadow) host.append(node);
				else element.append(node);
			}
		}
	}

	delete attr.shadow;
	delete attr.namespace;

	for (let key in attr) {
		if (key === "dataset") {
			if (Object.keys(attr.dataset) === 0) throw new Error("dataset must not be empty");
			if (typeof attr.dataset !== "object") throw new Error("dataset must be an object");
			for (let dataset_key in attr.dataset) element.dataset[dataset_key] = attr.dataset[dataset_key];
			continue;
		}
		if (key in element) element[key] = attr[key];
		else element.setAttribute(key, attr[key]);
	}

	if (shadow) return { host, element };
	else return element;
}

export function dateToYYYYMMDD(date, divider) {
	divider = divider ?? "-";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}${divider}${month}${divider}${day}`;
}

export function getIndexes(userdata, moduleId = -1, unitId = -1, cardId = -1) {
	const indexes = { moduleIndex: null, unitIndex: null, cardIndex: null };
	const { modules } = userdata;

	const moduleIndex = modules.findIndex((module) => module.id === parseInt(moduleId));
	if (moduleId >= 0) {
		indexes.moduleIndex = moduleIndex;
	}
	if (unitId >= 0) {
		const unitIndex = modules[moduleIndex].units.findIndex((unit) => unit.id === parseInt(unitId));
		indexes.unitIndex = unitIndex;
	}
	if (cardId >= 0) {
		const unitIndex = modules[moduleIndex].units.findIndex((unit) => unit.id === parseInt(unitId));
		const cardIndex = modules[moduleIndex].units[unitIndex].cards.findIndex((card) => card.id === parseInt(cardId));
		indexes.cardIndex = cardIndex;
	}
	return indexes;
}

export function toBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
