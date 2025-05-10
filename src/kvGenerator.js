const widgetConverters = {
	button: (widget) => `
Button:
    text: "${widget.id}"
    pos_hint: {"x": ${widget.x / 500}, "y": ${widget.y / 500}}
    size_hint: None, None
    size: 100, 50`.trim(),

	// Add more widget types here
};

function generateKvFromWidgets(widgets) {
	return widgets.map(widget => {
		const convert = widgetConverters[widget.type];
		return convert ? convert(widget) : `# Unknown widget type: ${widget.type}`;
	}).join('\n\n');
}

module.exports = { generateKvFromWidgets };
