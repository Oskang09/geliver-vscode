import 'rsuite/lib/styles/index.less';
import 'jsoneditor-react/es/editor.min.css';
import './app.css';

import ace from 'brace';
import 'brace/mode/json';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { JsonEditor } from 'jsoneditor-react';
import {
    Grid, Row, Col,
    SelectPicker, Form, FormGroup, ControlLabel,
    Panel, Nav, Button, Loader, Message, Icon
} from 'rsuite';
import { useLiveQuery } from 'dexie-react-hooks';

import SettingView from '#/views/setting';
import CollectionView from '#/views/collection';
import HistoryView from '#/views/history';
import RootContext from '#/controller';
import { generateUNIQ } from './util/generator';

function Geliver() {
    const root = useContext(RootContext);
    const [requestRef, responseRef] = [useRef(), useRef()];
    const [tab, setTab] = useState('history');
    const [theme, setTheme] = useState(window.editorTheme);
    const [appTheme, setAppTheme] = useState(window.appTheme);
    const [serverId, setServerId] = useState();
    const [serverSearch, setServerSearch] = useState('');
    const [endpoint, setEndpoint] = useState();
    const [endpointSearch, setEndpointSearch] = useState();
    const [loader, setLoader] = useState(false);
    const [error, setError] = useState(undefined);
    const [current, setCurrent] = useState('normal');
    let themeEl = null;

    const servers = useLiveQuery(
        () => root.db.listServers(serverSearch),
        [serverSearch]
    );
    const endpoints = useLiveQuery(
        () => root.db.listEndpoints(serverId, endpointSearch),
        [serverId, endpointSearch]
    );

    useEffect(() => {
        responseRef.current.jsonEditor.aceEditor.setOptions({ readOnly: true });

        root.view.request = requestRef.current;
        root.view.response = responseRef.current;

        const services = JSON.parse(window.autoload);
        for (const { service, methods } of services) {
            root.db.createServer(generateUNIQ(), service, methods)
        }
    }, []);

    useEffect(() => {
        if (endpoint && current === "normal") {
            const object = endpoints.find(x => x.endpoint === endpoint);
            root.view.setRequestJSON(object.request);
            root.view.setResponseJSON(object.response);
        }
    }, [endpoint]);

    useEffect(() => {
        if (theme) {
            import(`./assets/themes/${theme}.js`).then(() => {
                root.view.setRequestTheme(theme);
                root.view.setResponseTheme(theme);
                root.vscode.postMessage({
                    action: 'update.editor-theme',
                    payload: theme,
                })
            });
        }
    }, [theme]);

    useEffect(() => {
        if (themeEl) {
            themeEl.parentNode.removeChild(themeEl);
        }

        themeEl = document.createElement('link');
        themeEl.rel = 'stylesheet';
        themeEl.href = `${window.base}/${appTheme}.css`;
        themeEl.dataset.theme = appTheme;
        document.head.appendChild(themeEl);
        root.vscode.postMessage({
            action: 'update.app-theme',
            payload: appTheme,
        })
    }, [appTheme]);

    const onSendRequest = async () => {
        if (!serverId || !endpoint) {
            return;
        }

        setLoader(true);
        setError(undefined);

        const resId = generateUNIQ()
        const json = root.view.getRequestJSON();
        window.addEventListener('message', async (event) => {
            const { responseTo, payload } = event.data || {};
            if (responseTo == resId) {
                if (payload.error) {
                    setError(payload.message);
                }
                root.view.setResponseJSON(payload.result);
                await root.db.createHistory(serverId, endpoint, json, payload, payload.error);

                setLoader(false);
                root.view.historyController.refresh();
            }
        }, { once: true });

        const server = await root.db.getServerById(serverId);
        root.vscode.postMessage({
            response: resId,
            action: 'grpc.call',
            payload: {
                service: server.name,
                endpoint: endpoint,
                body: json,
            },
        })
    }

    const views = {
        setting: (
            <SettingView
                theme={theme}
                setTheme={setTheme}
                appTheme={appTheme}
                setAppTheme={setAppTheme}
            />
        ),
        preset: (
            <CollectionView
                theme={theme}
                setCurrent={setCurrent}
                setServerId={setServerId}
                setEndpoint={setEndpoint}
            />
        ),
        history: (
            <HistoryView
                setCurrent={setCurrent}
                setServerId={setServerId}
                setEndpoint={setEndpoint}
                setError={setError}
            />
        ),
    };

    return (
        <div>
            <Panel style={{ marginLeft: 40, marginRight: 40 }}>
                <Nav appearance="tabs" activeKey={tab} onSelect={setTab}>
                    <Nav.Item eventKey="history" icon={<Icon icon="history" />}>
                        History
                    </Nav.Item>
                    <Nav.Item eventKey="preset" icon={<Icon icon="list" />}>
                        Collection
                    </Nav.Item>
                    <Nav.Item eventKey="setting" icon={<Icon icon="setting" />}>
                        Setting
                    </Nav.Item>
                </Nav>
                <Panel>{views[tab]}</Panel>
            </Panel>

            <Grid fluid={true} style={{ marginTop: 'calc(3vh)', marginBottom: 'calc(3vh)', marginLeft: '20px', marginRight: '20px', height: 'calc(94vh)' }}>
                <Row style={{ height: '100%' }}>
                    <Col style={{ height: '100%' }} xs={10} xsPush={1}>
                        <Row style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
                            <Form fluid={true}>
                                <FormGroup>
                                    <ControlLabel>Server</ControlLabel>
                                    <div style={{ display: 'flex' }}>
                                        <SelectPicker
                                            style={{ flex: 1 }}
                                            block={true}
                                            placeholder="Please select server ..."
                                            value={serverId}
                                            onChange={setServerId}
                                            onSearch={setServerSearch}
                                            data={servers?.map(({ name, id }) => ({
                                                label: name,
                                                value: id,
                                            }))}
                                        />
                                    </div>
                                </FormGroup>
                                <FormGroup>
                                    <ControlLabel>Endpoint</ControlLabel>
                                    <div style={{ display: 'flex' }}>
                                        <SelectPicker
                                            style={{ flex: 1 }}
                                            block={true}
                                            placeholder="Please select endpoint ..."
                                            value={endpoint}
                                            onChange={(value) => {
                                                setCurrent('normal');
                                                setEndpoint(value);
                                            }}
                                            onSearch={setEndpointSearch}
                                            data={endpoints?.map(({ endpoint }) => ({
                                                label: endpoint,
                                                value: endpoint,
                                            }))}
                                        />
                                    </div>
                                </FormGroup>
                            </Form>
                            <JsonEditor
                                htmlElementProps={{ style: { flex: 1, marginBottom: 20, marginTop: 20 } }}
                                ref={requestRef}
                                mode="code"
                                ace={ace}
                                value={{}}
                            />
                            {
                                loader ? <Loader style={{ textAlign: 'center' }} content="Sending Request ..." /> : (
                                    <Button style={{ width: '100%' }} appearance="primary" onClick={onSendRequest}>
                                        <Icon icon="send" /> Send Request
                                    </Button>
                                )
                            }
                        </Row>
                    </Col>
                    <Col xs={10} xsPush={3} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {
                            error && (
                                <Message
                                    style={{ marginBottom: 20 }}
                                    type="error"
                                    showIcon={true}
                                    description={error}
                                />
                            )
                        }
                        <JsonEditor
                            htmlElementProps={{ style: { flex: 1 } }}
                            ref={responseRef}
                            mode="code"
                            ace={ace}
                            value={{}}
                        />
                    </Col>
                </Row>
            </Grid>

        </div>
    )
}

export default Geliver;