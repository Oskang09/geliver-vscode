# Extension Marketplace

* https://marketplace.visualstudio.com/items?itemName=Oskang09.geliver

# geliver 

Geliver UI support for vscode editor, natively support with `.proto` files. But if you need to have a complete feature still suggest to use [Postman](https://www.postman.com/).

## Features

* Request, Response History
* Collection and Preset 
* App and Editor Theme
* Auto import endpoints from servers
* Import & Export Data ( currently not available in vscode webview )
* Only support UnaryCall now

## Todo

* Implement client-streaming, server-streaming, and bidirectional-streaming gRPC methods

## Requirements

* Support basic GRPC server with `.proto` files generation

## Extension Settings

This extension contributes the following settings:

* `geliver.protos`: default protos file path and server settings ( larger directory will take longer to load )
* `geliver.app_theme`: default app theme 
* `geliver.editor_theme`: default editor theme

## Example Settings & Screenshot

![structure](https://user-images.githubusercontent.com/15674107/154677370-9b7cea2e-40d7-4dcf-854e-ee723726166d.png)

![image](https://user-images.githubusercontent.com/15674107/154681515-d282167b-12c8-467f-b254-a35a72a7bd65.png)

## Known Issues

1. Currently webview is not able to import & export data.
2. Data not cached since using IndexedDB. In future maybe can use `dexie-cloud`.

## Advanced: Faker Data Generation

If you want to have fake data when selecting endpoint to call, you can do with `proto custom field options` as below. Currently it's generating using [Faker](https://github.com/faker-js/faker). As example if you want to have random names you can make proto as below. It will call `faker.name.findName()`.

```proto

import "google/protobuf/descriptor.proto";
extend google.protobuf.FieldOptions {
    optional string geliver = 50000;
}

message ExampleRequest {
    string ID  = 1;
    string OrganizationID = 2 [(geliver)="name.findName"];
}
```

