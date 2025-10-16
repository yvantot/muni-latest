export function getRegex() {
	return {
		getPromptParser: () => {
			return {
				module_info: /.*-mtitle=(.*?)-mdesc=(.*?)-micon=(.*?)(?=-utitle|\s*$)/g,
				units_grabber: /(-utitle=[\s\S]+?)(?=-utitle=|\s*$)/g,
				unit_info: /.*?-utitle=(.*?)-udesc=(.*?)-uicon=(.*?)(?=-|\s*$)/g,

				fl: /-front=([\s\S]+?)-back=([\s\S]+?)(?=-.+=|\s*$)/g,
				id: /-ique=([\s\S]+?)-ians=([\s\S]+?)(?=-.+=|\s*$)/g,
				tf: /-tque=([\s\S]+?)-tf=([\s\S]+?)(?=-.+=|\s*$)/g,
				mt: /-mque=([\s\S]+?)-choices=([\s\S]+?)-index=([\s\S]+?)(?=-.+=|\s*$)/g,
			};
		},
	};
}
