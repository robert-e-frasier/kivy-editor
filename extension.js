const vscode = require('vscode');
const { exec } = require('child_process');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Kivy Editor extension is active.');

	// Register the sidebar launcher
	const sidebarLauncher = new KivySidebarLauncher();
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("kivyEditorView", sidebarLauncher)
	);


	// Register the main Kivy Editor command
	const disposable = vscode.commands.registerCommand('kivy-editor.start', function () {
		checkKivy(isInstalled => {
			if (isInstalled) {
				const panel = vscode.window.createWebviewPanel(
					'kivyEditor',
					'Kivy Editor',
					vscode.ViewColumn.One,
					{ enableScripts: true }
				);
				panel.webview.html = getWebviewContent();
			} else {
				vscode.window.showWarningMessage(
					'Kivy is not installed. Click here to install it.',
					'Install Kivy'
				).then(selection => {
					if (selection === 'Install Kivy') {
						installKivy();
						vscode.window.showInformationMessage('Installing Kivy... check the terminal for progress.');

						vscode.window.showWarningMessage(
							'Once installation is complete, please restart VS Code to activate the Kivy Editor.',
							'OK'
						);
					}
				});
			}
		});
	});


	context.subscriptions.push(disposable);
}

function getSidebarHtml(kivyInstalled) {
	const message = kivyInstalled
		? `<h3>Kivy is installed 🎉</h3>
		   <button onclick="vscode.postMessage({ command: 'openEditor' })">Open Kivy Editor</button>`
		: `<h3>Kivy is not installed</h3>
		   <p>Click below to install Kivy. Then restart VS Code.</p>
		   <button onclick="vscode.postMessage({ command: 'installKivy' })">Install Kivy</button>`;

	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		</head>
		<body style="padding: 10px; font-family: sans-serif;">
			${message}
			<script>
				const vscode = acquireVsCodeApi();
			</script>
		</body>
		</html>
	`;
}


class KivySidebarLauncher {
	resolveWebviewView(webviewView) {
		webviewView.webview.options = {
			enableScripts: true
		};

		checkKivy((isInstalled) => {
			webviewView.webview.html = getSidebarHtml(isInstalled);
		});

		webviewView.webview.onDidReceiveMessage(message => {
			if (message.command === 'openEditor') {
				vscode.commands.executeCommand('kivy-editor.start');
			}
			if (message.command === 'installKivy') {
				installKivy();
				vscode.window.showWarningMessage(
					'Please restart VS Code after installation completes.'
				);
			}
		});
	}
}



function checkKivy(callback) {
	exec('python -m pip show kivy', (error, stdout) => {
		if (!error && stdout.toLowerCase().includes('name: kivy')) {
			return callback(true);
		} else {
			return callback(false);
		}
	});
}


function installKivy() {
	const terminal = vscode.window.createTerminal('Kivy Installer');
	terminal.show();
	terminal.sendText('python -m pip install kivy[full]');
}

function getWebviewContent() {
	return `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Kivy Editor</title>
		<style>
			body {
				margin: 0;
				padding: 0;
				background-color: #1e1e1e;
				color: white;
				font-family: sans-serif;
				display: flex;
				height: 100vh;
				overflow: hidden;
			}
			#sidebar {
				width: 200px;
				background-color: #2c2c2c;
				padding: 10px;
				border-right: 1px solid #444;
			}
			#canvas {
				flex: 1;
				position: relative;
				background-color: #2a2a2a;
			}
			.draggable {
				cursor: grab;
				padding: 5px 10px;
				margin-bottom: 10px;
				background: #3c3c3c;
				border: 1px solid #666;
				border-radius: 5px;
				user-select: none;
			}
			.kivy-widget {
				position: absolute;
				background: #4caf50;
				padding: 5px 10px;
				border-radius: 4px;
				border: 1px solid #888;
			}
		</style>
	</head>
	<body>
		<div id="sidebar">
			<div id="buttonWidget" class="draggable" draggable="true">Button</div>
		</div>
		<div id="canvas"></div>

		<script>
			const vscode = acquireVsCodeApi();
			const buttonWidget = document.getElementById('buttonWidget');
			const canvas = document.getElementById('canvas');

			let widgetList = [];
			let widgetIdCounter = 1;

			buttonWidget.addEventListener('dragstart', (e) => {
				e.dataTransfer.setData('widget-type', 'button');
			});

			canvas.addEventListener('dragover', (e) => {
				e.preventDefault()
			});

			canvas.addEventListener('drop', (e) => {
				e.preventDefault();
				const widgetType = e.dataTransfer.getData('widget-type');
				const x = e.offsetX;
				const y = e.offsetY;

				const widgetID = \`widget_\${widgetIdCounter++}\`;
				
				widgetList.push({
					id: widgetID,
					type: widgetType,
					x: x,
					y: y
				});

				console.log('Current widget list:', widgetList);

				const widget = document.createElement('div');
				widget.className = 'kivy-widget';
				widget.innerText = widgetType;
				widget.style.left = x + 'px';
				widget.style.top = y + 'px';
				widget.setAttribute('data-id', widgetID);

				canvas.appendChild(widget);
			});
		</script>
	</body>
	</html>
	`;
}


function deactivate() {}

module.exports = {
	activate,
	deactivate
};
