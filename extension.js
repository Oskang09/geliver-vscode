const vscode = require('vscode');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('geliver.open_ui', async function () {
		const config = vscode.workspace.getConfiguration('geliver');
		const appTheme = config.get('app_theme', 'dark');
		const editorTheme = config.get('editor_theme', 'dracula');
		const servers = config.get('servers', []);
		const distFolder = vscode.Uri.file(path.join(context.extensionPath, 'dist'));
		const assetsFolder = vscode.Uri.file(path.join(context.extensionPath, 'assets'))
		const panel = vscode.window.createWebviewPanel(
			'geliver',
			'Geliver',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [distFolder, assetsFolder]
			}
		);

		const distBase = panel.webview.asWebviewUri(distFolder).toString();
		panel.webview.html = `
		<!DOCTYPE html>
		<html lang="en">
		
		<head>
		  <meta charset="UTF-8" />
		  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
		  <title>Geliver</title>
		
		  <script>
			window.mode = "vscode-webview";
			window.base = "${distBase}";
			window.appTheme = "${appTheme}";
			window.editorTheme = "${editorTheme}";
			window.servers = '${JSON.stringify(servers)}';
		  </script>
		  <script type="module" crossorigin src="${distBase}/assets/index.bcfd9fdb.js"></script>
			<link rel="modulepreload" href="${distBase}/assets/vendor.fa37ab51.js">
			<link rel="stylesheet" href="${distBase}/assets/vendor.1a83f3cc.css">
			<link rel="stylesheet" href="${distBase}/assets/index.6a640632.css">
		  <link rel="manifest" href="${distBase}/manifest.webmanifest"></head>
		  <link href="https://cdn.jsdelivr.net/npm/jsoneditor/dist/jsoneditor.min.css" rel="stylesheet" type="text/css">
		</head>
		
		<body>
		  <div id="root"></div>
		</body>
		
		</html>
		`;
	});

	context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = { activate, deactivate }