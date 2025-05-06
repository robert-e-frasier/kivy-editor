// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require('child_process');


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "kivy-editor" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('kivy-editor.start', function () {
		exec('py -m pip show kivy', (error, stdout, stderr) => {
			if (error || !stdout.includes('Name: Kivy')) {
				vscode.window.showWarningMessage(
					'Kivy is not installed. Click here to install it.',
					'Install Kivy'
				).then(selection => {
					if (selection === 'Install Kivy') {
						const terminal = vscode.window.createTerminal('Kivy Installer');
						terminal.show();
						terminal.sendText('py -m pip install kivy[full]');
					}
				});
			} else {
				vscode.window.showInformationMessage('Kivy is installed!');
				// This is where we’ll launch the editor view in Phase 3
			}
		});
	});
	

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
