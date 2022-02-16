# geliver 

Webview version of Geliver UI for support internally in vscode editor.

## Features

* Request, Response History
* Collection and Preset 
* App and Editor Theme
* Import & Export Data ( currently not available in vscode webview )
* Auto import endpoints from servers

## Requirements

* Support basic GRPC server with `geliver-devserver` registered

## Extension Settings

This extension contributes the following settings:

* `geliver.servers`: default servers setting will inject automatically
* `geliver.app_theme`: default app theme 
* `geliver.editor_theme`: default editor theme

## Known Issues

1. Currently webview is not able to import & export data, even tried local path believe it's some library not supported. 
2. GRPC Setting will be bypass etc `UnaryInterceptor`, because currently is calling GRPC with go reflection instead grpc client.