class ViewAPI {

    constructor() {
        this.request = null;
        this.response = null;
        this.historyController = {};
    }

    getRequestJSON = () => {
        return this.request.jsonEditor.get();
    }

    setRequestTheme = (theme) => {
        this.request.jsonEditor.aceEditor.setTheme(`ace/theme/${theme}`);
    }

    setResponseTheme = (theme) => {
        this.response.jsonEditor.aceEditor.setTheme(`ace/theme/${theme}`);
    }

    getAceTheme = (theme) => {
        return `ace/theme/${theme}`;
    }

    setResponseJSON = (response) => {
        try {
            const responseJSON = JSON.parse(response);
            this.response.jsonEditor.set(responseJSON);
        } catch (err) {
            this.response.jsonEditor.set(response);
        }
    }

    setRequestJSON = (request) => {
        try {
            const requestJSON = JSON.parse(request);
            this.request.jsonEditor.set(requestJSON);
        } catch (err) {
            this.request.jsonEditor.set(request);
        }
    }

}

export default ViewAPI;