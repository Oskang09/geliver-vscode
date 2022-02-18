import { createContext } from 'react';

import DexieDB from './database';
import ViewAPI from './view';

class RootAPI {

    constructor() {
        // eslint-disable-next-line no-undef
        this.vscode = acquireVsCodeApi();
        this.view = new ViewAPI(this);
        this.db = new DexieDB(this);
    }
}

const RootInstance = new RootAPI();
const RootContext = createContext(RootInstance);
export { RootAPI, RootInstance };
export default RootContext;