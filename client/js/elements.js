export function getElements() {
	return {
		getSettingsSide: () => {
			return {
				LIBRARY: document.getElementById("s-library"),
				GENERATE: document.getElementById("s-generate"),
				NOTE: document.getElementById("s-note"),
				POPSET: document.getElementById("s-popset"),
				HELP: document.getElementById("s-help"),
				ACCOUNT: document.getElementById("s-account"),
			};
		},
		getSettingsBody: () => {
			return {
				LIBRARY: document.getElementById("b-library"),
				GENERATE: document.getElementById("b-generate"),
				NOTE: document.getElementById("b-note"),
				POPSET: document.getElementById("b-popset"),
				HELP: document.getElementById("b-help"),
				ACCOUNT: document.getElementById("b-account"),
			};
		},
		getSessionBody: () => {
			return {
				SCARDC: document.getElementById("scard-container"),
			};
		},
		getLibraryElements: () => {
			return {
				CURRPAGE: document.getElementById("current-library-page"),
				CURRPATH: document.getElementById("current-library-path"),
				CONTENT: document.getElementById("content"),
				NBACK: document.getElementById("navigate-back"),
				MACT: document.getElementById("mactions"),
				UACT: document.getElementById("uactions"),
				CACT: document.getElementById("cactions"),
				MADD: document.getElementById("add-module"),
				MSORT: document.getElementById("sort-modules"),
				UADD: document.getElementById("add-unit"),
				USORT: document.getElementById("sort-units"),
				CADD: document.getElementById("add-card"),
				CSORT: document.getElementById("sort-cards"),
			};
		},
		getNoteElements: () => {
			return {
				UPROMPT: document.getElementById("userprompt"),
				GENERATE: document.getElementById("parsenote"),
			};
		},
		getGenerateElements: () => {
			return {
				GPTSOURCE: document.getElementById("chatgpt"),
				GEMINISOURCE: document.getElementById("gemini"),
				UPROMPT: document.getElementById("userpromptai"),
				QTYPE: document.getElementById("qtypeai"),
				UCOUNT: document.getElementById("unitcount"),
				CCOUNT: document.getElementById("cardcount"),
				GENERATE: document.getElementById("generate"),
			};
		},
		getSettingElements: () => {
			return {
				SRADIO: document.getElementById("short-term-learning"),
				LRADIO: document.getElementById("long-term-learning"),
				INTERVALMS: document.getElementById("intervalms"),
				WHITELIST: document.getElementById("whitelist"),
				WHLBTN: document.getElementById("whitelistbtn"),
				INTBTN: document.getElementById("intervalbtn"),
			};
		},
		getModulePopup: () => {
			return {
				MCONT: document.getElementById("module-add"),
				MCONF: document.getElementById("mconf"),
				MCONFEDIT: document.getElementById("mconfedit"),
				MCANC: document.getElementById("mcanc"),
				MTITLE: document.getElementById("mtitle"),
				MDESC: document.getElementById("mdesc"),
				MAUTH: document.getElementById("mauth"),
				MICON: document.getElementById("micon"),
			};
		},
		getUnitPopup: () => {
			return {
				UCONT: document.getElementById("unit-add"),
				UCONF: document.getElementById("uconf"),
				UCANC: document.getElementById("ucanc"),
				UCONFEDIT: document.getElementById("uconfedit"),
				UTITLE: document.getElementById("utitle"),
				UDESC: document.getElementById("udesc"),
				UICON: document.getElementById("uicon"),
			};
		},
		getCardPopup: () => {
			return {
				CCONT: document.getElementById("card-add"),
				CCONF: document.getElementById("cconf"),
				CCONFEDIT: document.getElementById("cconfedit"),
				CCANC: document.getElementById("ccanc"),
				CQUE: document.getElementById("cquestion"),
				CANS: document.getElementById("canswer"),
				CCHO: document.getElementById("cchoices"),
				CCORC: document.getElementById("ccorrectc"),
				CORC: document.getElementById("correctc"),
				QTYPE: document.getElementById("qtype"),
				CQUEC: document.getElementById("cquestionc"),
				CANSC: document.getElementById("canswerc"),
				CCHOC: document.getElementById("cchoicesc"),
				CIMG: document.getElementById("cimage"),
			};
		},
	};
}
