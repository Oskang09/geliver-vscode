const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { faker } = require('@faker-js/faker');
const protobuf = require('protobufjs');
const grpc = require('@grpc/grpc-js');
const googleFiles = require('google-proto-files');
const Service = require('./service');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let panel = undefined;
	let channel = vscode.window.createOutputChannel("Geliver");
	const config = vscode.workspace.getConfiguration('geliver');
	const distFolder = vscode.Uri.file(path.join(context.extensionPath, 'dist'));
	const assetsFolder = vscode.Uri.file(path.join(context.extensionPath, 'assets'))
	const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
	const html = fs.readFileSync(
		vscode.Uri.file(path.join(context.extensionPath, 'dist', 'index.html')).fsPath,
		{ encoding: 'utf8' }
	);

	let disposable = vscode.commands.registerCommand('geliver.open_ui', async function () {

		const appTheme = config.get('app_theme', 'dark');
		const editorTheme = config.get('editor_theme', 'dracula');
		const protos = config.get('protos', []);
		const services = {};
		const autoload = [];

		vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Geliver", cancellable: false }, async (progress) => {
			progress.report({ message: 'Loading protobuf...' });
			const step = Math.floor(100 / protos.length);

			try {
				for (const proto of protos) {
					await sleep(100);
					progress.report({ increment: step, message: 'Loading ' + proto['name'] });

					const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
					const localPaths = (proto['path'] || []).reduce(function (current, value) {
						const newPaths = readProtoPaths(path.resolve(workspacePath, value));
						current.push(...newPaths);
						return current;
					}, []);

					const paths = (proto['custom'] || []).reduce(function (current, value) {
						const [type, target] = value.split(':')
						switch (type) {

							case "google":
								current.push(googleFiles.getProtoPath(path.resolve("..", target)));
								break

						}
						return current;
					}, localPaths);

					const root = protobuf.loadSync(paths);
					const service = root.lookupService(proto['name']);
					const methods = [];
					const getTypeValue = function (type) {
						switch (type) {
							case "double":
								return 0.0

							case "float":
								return 0.0

							case "bool":
								return true

							case "bytes":
							case "string":
								return ""

							case "int32":
							case "int64":
							case "uint32":
							case "uint64":
							case "sint32":
							case "sint64":
							case "fixed32":
							case "fixed64":
							case "sfixed32":
							case "sfixed64":
								return 0

							default:
								return getFakerValue(root.lookupTypeOrEnum(type).toJSON()['fields']);
						}
					}

					const getFakerValue = function (fields) {
						const value = {};
						for (const [field, { keyType, type, rule, options }] of Object.entries(fields)) {
							if (options && options['(geliver)']) {
								const fakerFunc = faker[options['(geliver)']];
								if (fakerFunc) {
									value[field] = fakerFunc();
									continue
								}
							}

							const isArray = rule === "repeated";
							const isMap = keyType && keyType !== "";
							if (isArray) {
								value[field] = Array.from(Array(faker.datatype.number({ min: 1, max: 5 }))).map(() => getTypeValue(type));
								continue
							}

							if (isMap) {
								value[field] = {};
								Array.from(Array(faker.datatype.number({ min: 1, max: 3 }))).forEach(() => {
									// @ts-ignore
									value[field][getTypeValue(keyType)] = getTypeValue(type);
								});
								continue
							}

							value[field] = getTypeValue(type)
						}
						return value;
					}

					for (const [func, { requestType, responseType }] of Object.entries(service.toJSON()['methods'])) {
						methods.push({
							endpoint: func,
							request: getFakerValue(root.lookupType(requestType).toJSON()['fields']),
							response: getFakerValue(root.lookupType(responseType).toJSON()['fields']),
						})
					}

					const Client = grpc.makeGenericClientConstructor({}, proto['name'], {});
					const client = new Client(proto['connection'], grpc.credentials.createInsecure())
					const rpcImpl = function (method, requestData, callback) {
						const service = method.parent, namespace = service.parent;
						client.makeUnaryRequest(
							"/" + namespace.name + "." + service.name + "/" + method.name,
							arg => arg,
							arg => arg,
							requestData,
							callback,
						)
					}

					const rpcClient = new Service(rpcImpl, false, false);
					services[proto['name']] = function (endpoint, body) {
						return new Promise((resolve, reject) => {
							const methodDefinition = service['methods'][endpoint]
							rpcClient.rpcCall(
								methodDefinition,
								// @ts-ignore
								service.lookupType(methodDefinition.requestType),
								service.lookupType(methodDefinition.responseType),
								body,
								(error, value) => {
									if (error) {
										return reject(error);
									}
									resolve(value);
								}
							);
						})
					}
					autoload.push({ service: proto['name'], methods })
				}
			} catch (err) {
				channel.appendLine(err.stack);
				vscode.window.showErrorMessage("Error occurs when reading proto: " + err.message, 'Log').then(() => channel.show());
				return
			}

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
				panel.webview.onDidReceiveMessage(({ action, payload, response }) => {
					switch (action) {

						case "update.app-theme":
							config.update("app_theme", payload)
							break

						case "update.editor-theme":
							config.update("editor_theme", payload)
							break

						case "grpc.call":
							services[payload.service](payload.endpoint, payload.body)
								.then(result => {
									panel.webview.postMessage({
										responseTo: response,
										payload: { error: false, result }
									})
								})
								.catch(error => {
									let result = {};
									try {
										result = JSON.parse(error.details)
									} catch (_) {
										result = error.details
									}

									panel.webview.postMessage({
										responseTo: response,
										payload: {
											error: true,
											message: error.message,
											result: result,
										}
									})
								})
							break

					}
				});

				panel.webview.html = html.replaceAll("/geliver", distBase).replaceAll("<!-- inject-placeholder -->", `
						<script>
							window.base = "${distBase}";
							window.appTheme = "${appTheme}";
							window.editorTheme = "${editorTheme}";
							window.autoload = '${JSON.stringify(autoload)}';
						</script>
						<link href="https://cdn.jsdelivr.net/npm/jsoneditor/dist/jsoneditor.min.css" rel="stylesheet" type="text/css">
					`
				)
			}
		})
	});

	context.subscriptions.push(disposable);
}

function deactivate() { }


function readProtoPaths(dir) {
	const paths = [];
	const files = fs.readdirSync(dir)
	for (const file of files) {
		const filePath = path.resolve(dir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			paths.push(...readProtoPaths(filePath))
			continue
		}

		if (!stat.isFile() || !filePath.endsWith('.proto')) {
			continue
		}
		paths.push(filePath);
	}
	return paths;
}

function sleep(millis) {
	return new Promise(resolve => setTimeout(resolve, millis));
}

module.exports = { activate, deactivate }