export function getStruct() {
	return {
		MODULE: {
			id: 0,
			title: "",
			description: "",
			author: "",
			icon: "",
			created_at: new Date().toISOString(),
			is_active: true,
			units: [],
		},
		UNIT: {
			id: 0,
			title: "",
			description: "",
			icon: "",
			created_at: new Date().toISOString(),
			is_active: true,
			cards: [],
		},
		CARD: {
			id: 0,
			card_type: null, // see Q_TYPES
			created_at: new Date().toISOString(),

			question: null,
			answer: null,
			answers: null,

			// Short term
			level: 1,

			// Long term
			easiness: 2.5,
			interval: 1,
			repetitions: 0,
			next_review: new Date().toISOString(),
		},
	};
}

export const Q_TYPES = {
	FL: 0,
	TF: 1,
	ID: 2,
	MT: 3,
};

export const NAVIGATION = {
	MODULES: 0,
	UNITS: 1,
	CARDS: 2,
};

export const REASON = {
	MODULE: 0,
	UNIT: 1,
	CARD: 2,
	SCARD: 3,
	SETTING: 4,
};

export const PARSE = {
	module: `-mtitle=Module Title
-mdesc=Module Description
-micon=Module Icon`,
	unit: `-utitle=Unit Title
-udesc=Unit Description
-uicon=Unit Icon`,
	fl: `-front=Flashcard Front
-back=Flashcard Back`,
	id: `-ique=Identification Question
-ians=Identification Answer`,
	tf: `-tque=True or False Question
-tf=T/F`,
	mt: `-mque=Multiple Question
-choices=A,B,C
-index=0 (correct index of the correct answer, index starts at 0)`,
};
