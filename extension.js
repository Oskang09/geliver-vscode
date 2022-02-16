const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let panel = undefined;

	let disposable = vscode.commands.registerCommand('geliver.open_ui', async function () {
		const config = vscode.workspace.getConfiguration('geliver');
		const appTheme = config.get('app_theme', 'dark');
		const editorTheme = config.get('editor_theme', 'dracula');
		const servers = config.get('servers', []);
		const distFolder = vscode.Uri.file(path.join(context.extensionPath, 'dist'));
		const assetsFolder = vscode.Uri.file(path.join(context.extensionPath, 'assets'))
		const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
		const html = fs.readFileSync(
			vscode.Uri.file(path.join(context.extensionPath, 'dist', 'index.html')).fsPath,
			{ encoding: 'utf8' }
		);

		if (panel) {
			panel.reveal(columnToShowIn);
		} else {
			panel = vscode.window.createWebviewPanel(
				'geliver',
				'Geliver',
				vscode.ViewColumn.Active,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [distFolder, assetsFolder]
				}
			);

			const distBase = panel.webview.asWebviewUri(distFolder).toString();
			panel.onDidDispose(() => { panel = undefined }, context.subscriptions);
			panel.title = "Geliver UI"
			panel.webview.html = html.replaceAll("/geliver", distBase).replaceAll("<!-- inject-placeholder -->", `
			<script>
				window.mode = "vscode-webview";
				window.base = "${distBase}";
				window.appTheme = "${appTheme}";
				window.editorTheme = "${editorTheme}";
				window.servers = '${JSON.stringify(servers)}';
			</script>
			<link href="https://cdn.jsdelivr.net/npm/jsoneditor/dist/jsoneditor.min.css" rel="stylesheet" type="text/css">
		`)
		}
	});

	context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = { activate, deactivate }