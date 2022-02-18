# geliver 

Geliver UI support for vscode editor, natively support with `.proto` files.

## Features

* Request, Response History
* Collection and Preset 
* App and Editor Theme
* Auto import endpoints from servers
* Import & Export Data ( currently not available in vscode webview )

## Requirements

* Support basic GRPC server with `.proto` files generation

## Extension Settings

This extension contributes the following settings:

* `geliver.protos`: default protos file path and server settings ( larger directory will take longer to load )
* `geliver.app_theme`: default app theme 
* `geliver.editor_theme`: default editor theme

## Example Settings



## Known Issues

1. Currently webview is not able to import & export data.
2. Data not cached since using IndexedDB. In future maybe can use `dexie-cloud`.