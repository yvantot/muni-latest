import { Q_TYPES } from "./struct.js";

export function buildPrompt(ustr, unit_count, card_count, q_types) {
	const m_format = `
    %module%
    %mtitle=Title
    %mdesc=Description
    %micon=Emoji icon`;
	const u_format = `
    %unit%
    %utitle=Title
    %udesc=Description
    %uicon=Emoji icon`;
	const fl_format = `
    %card%
    %ctype=FL
    %cques=Question
    %cans=Answer`;
	const tf_format = `
    %card%
    %ctype=TF
    %cques=Question
    %cans=T/F`;
	const id_format = `
    %card%
    %ctype=ID
    %cques=Question
    %cans=Answer`;
	const mt_format = `
    %card%
    %ctype=MT
    %cques=Question
    %ccho=Question choices separated by ",,"
    %cans=Index of the correct question`;

	let prompt = `
    Make me ${unit_count} unit with ${card_count} card each with this format.
    There can only be one module. Don't close them like HTML tag, it'll ruin the format.
    Output it as plain text, no formatting, no interactives and no testing of new features, just the raw text.
    
    ${m_format} 
    ${u_format}
    ${q_types.includes(Q_TYPES.FL) ? fl_format : ""}
    ${q_types.includes(Q_TYPES.TF) ? tf_format : ""}
    ${q_types.includes(Q_TYPES.ID) ? id_format : ""}
    ${q_types.includes(Q_TYPES.MT) ? mt_format : ""}
    ${u_format}
    ... Continue

    The context for the topic I want you to create is: ${ustr}
    `;
	return prompt.replaceAll(/[\s]+/g, " ");
}

const x = buildPrompt("Mathematics", 3, 5, [Q_TYPES.FL, Q_TYPES.MT]);
console.log(x);
