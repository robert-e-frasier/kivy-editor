const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { generateKvFromWidgets } = require('./src/kvGenerator');


let selectedKvUri = null;

function getWebviewContent(context, webview) {
	const htmlPath = path.join(context.extensionPath, 'html', 'editor.html');
	let html = fs.readFileSync(htmlPath, 'utf8');

	const cssPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'editor.css'));
	const jsPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'editor.js'));

	const cssUri = webview.asWebviewUri(cssPath);
	const jsUri = webview.asWebviewUri(jsPath);

	html = html.replace('</head>', `<link rel="stylesheet" href="${cssUri}">\n</head>`);
	html = html.replace('</body>', `<script src="${jsUri}"></script>\n</body>`);

	return html;
}

let currentPanel = null; // <-- Add this at the top level (outside activate)

function activate(context) {
	console.log('Kivy Editor extension is active.');

	const sidebarLauncher = new KivySidebarLauncher(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("kivyEditorView", sidebarLauncher)
	);

	const disposable = vscode.commands.registerCommand('kivy-editor.start', () => {
		checkKivy(isInstalled => {
			if (isInstalled) {
				// If the panel already exists, just reveal it
				if (currentPanel) {
					currentPanel.reveal(vscode.ViewColumn.One);
					return;
				}

				// Otherwise, create a new panel
				currentPanel = vscode.window.createWebviewPanel(
					'kivyEditor',
					'Kivy Editor',
					vscode.ViewColumn.One,
					{ 
						enableScripts: true,
						retainContextWhenHidden: true
					 }
				);

				currentPanel.webview.html = getWebviewContent(context, currentPanel.webview);

				currentPanel.onDidDispose(() => {
					currentPanel = null; // Clear reference when user closes it
				});

				currentPanel.webview.onDidReceiveMessage(message => {
					if (message.command === 'selectKvFile') {
						vscode.window.showOpenDialog({
							canSelectMany: false,
							openLabel: 'Open .kv File',
							filters: { 'KV files': ['kv'] }
						}).then(fileUri => {
							if (fileUri && fileUri[0]) {
								selectedKvUri = fileUri[0];
								currentPanel.webview.postMessage({
									command: 'kvFileSelected',
									path: fileUri[0].fsPath
								});
							}
						});
					}

					if (message.command === 'submitKvLayout') {
						const kvCode = generateKvFromWidgets(message.widgets);
						fs.writeFileSync(selectedKvUri.fsPath, kvCode, 'utf-8');
						vscode.window.showInformationMessage('KV layout submitted successfully!');
					}
				});
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

class KivySidebarLauncher {
	constructor(context) {
		this.context = context;
	}

	resolveWebviewView(webviewView) {
		webviewView.webview.options = { enableScripts: true };
		checkKivy(isInstalled => {
			webviewView.webview.html = getSidebarHtml(this.context, isInstalled);
		});
		webviewView.webview.onDidReceiveMessage(message => {
			if (message.command === 'openEditor') {
				vscode.commands.executeCommand('kivy-editor.start');
			}
			if (message.command === 'installKivy') {
				installKivy();
				vscode.window.showWarningMessage('Please restart VS Code after installation completes.');
			}
			if (message.command === 'selectKvFile') {
				vscode.window.showOpenDialog({
					canSelectMany: false,
					openLabel: 'Open .kv File',
					filters: { 'KV files': ['kv'] }
				}).then(fileUri => {
					if (fileUri && fileUri[0]) {
						selectedKvUri = fileUri[0];
						webviewView.webview.postMessage({
							command: 'kvFileSelected',
							path: fileUri[0].fsPath
						});
					}
				});
			}
		});
	}
}


function getSidebarHtml(context, kivyInstalled) {
	const sidebarPath = path.join(context.extensionPath, 'html', 'sidebar.html');
	let html = fs.readFileSync(sidebarPath, 'utf8');

	const statusBlock = kivyInstalled
		? `<h3>Kivy is installed 🎉</h3><button onclick="vscode.postMessage({ command: 'openEditor' })">Open Kivy Editor</button>`
		: `<h3>Kivy is not installed</h3><p>Click below to install Kivy. Then restart VS Code.</p><button onclick="vscode.postMessage({ command: 'installKivy' })">Install Kivy</button>`;

	return html.replace('<!--STATUS_BLOCK-->', statusBlock);
}


function checkKivy(callback) {
	exec('python -m pip show kivy', (error, stdout) => {
		callback(!error && stdout.toLowerCase().includes('name: kivy'));
	});
}

function installKivy() {
	const terminal = vscode.window.createTerminal('Kivy Installer');
	terminal.show();
	terminal.sendText('python -m pip install kivy[full]');
}


function deactivate() {}

module.exports = { activate, deactivate };
