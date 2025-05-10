/// <reference lib="dom" />
/* global window, document */

// VS Code API
// @ts-ignore
const vscode = window.acquireVsCodeApi();


(() => {
	const buttonWidget = document.getElementById('buttonWidget');
	const canvas = document.getElementById('canvas');
	const kvFilePath = document.getElementById('kvFilePath');
	const submitButton = /** @type {HTMLButtonElement} */ (document.getElementById('submitKvButton'));


	if (!buttonWidget || !canvas || !kvFilePath || !submitButton) return;

	let widgetList = [];
	let widgetIdCounter = 1;

	buttonWidget.addEventListener('dragstart', e => {
		e.dataTransfer.setData('widget-type', 'button');
	});

	canvas.addEventListener('dragover', e => e.preventDefault());

	canvas.addEventListener('drop', e => {
		e.preventDefault();
		const widgetType = e.dataTransfer.getData('widget-type');
		const x = e.offsetX;
		const y = e.offsetY;
		const widgetID = `widget_${widgetIdCounter++}`;

		widgetList.push({ id: widgetID, type: widgetType, x, y });

		const widget = document.createElement('div');
		widget.className = 'kivy-widget';
		widget.innerText = widgetType;
		widget.style.left = `${x}px`;
		widget.style.top = `${y}px`;
		widget.setAttribute('data-id', widgetID);

		canvas.appendChild(widget);
	});

	submitButton.addEventListener('click', () => {
		vscode.postMessage({
			command: 'submitKvLayout',
			widgets: widgetList
		});
	});

	window.addEventListener('message', event => {
		if (event.data.command === 'kvFileSelected') {
			kvFilePath.textContent = 'Selected File: ' + event.data.path;
			submitButton.disabled = false;
		}
	});

	submitButton.addEventListener('click', () => {
	vscode.postMessage({
		command: 'submitKvLayout',
		widgets: widgetList
		});
	});

})();
