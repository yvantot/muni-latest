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
