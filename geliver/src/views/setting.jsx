import RootContext from '#/controller';
import download from 'downloadjs';
import React, { useContext, useEffect, useState } from 'react';
import {
    Button, Col, Grid,
    HelpBlock, Icon, Radio,
    RadioGroup, Row, SelectPicker,
    Modal, Alert, Uploader, Progress, Message
} from 'rsuite';

const themes = [
    "ambiance", "chaos", "chrome", "clouds", "clouds_midnight",
    "cobalt", "crimson_editor", "dawn", "dracula", "dreamweaver",
    "eclipse", "github", "gob", "gruvbox", "idle_fingers", "iplastic",
    "katzenmilch", "kr_theme", "kuroir", "merbivore", "merbivore_soft",
    "monokai", "mono_industrial", "pastel_on_dark", "solarized_dark",
    "solarized_light", "sqlserver", "terminal", "textmate", "tomorrow",
    "tomorrow_night", "tomorrow_night_blue", "tomorrow_night_bright",
    "tomorrow_night_eighties", "twilight", "vibrant_ink", "xcode"
];

function Setting({ theme, setTheme, appTheme, setAppTheme }) {
    const root = useContext(RootContext);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [task, setTask] = useState(false);
    const [progressState, setProgressState] = useState(undefined);

    const onClose = () => {
        setDeleteConfirm(undefined);
    };

    return (
        <Grid fluid={true}>
            <Row style={{ display: 'flex', alignItems: 'center' }}>
                <Col xs={2}>
                    <p>Editor Theme</p>
                </Col>
                <Col xs={6}>
                    <SelectPicker
                        block={true}
                        value={theme}
                        onChange={setTheme}
                        data={themes.map(x => ({
                            label: x,
                            value: x,
                        }))}
                    />
                </Col>
            </Row>

            <Row style={{ display: 'flex', alignItems: 'center', marginTop: 15 }}>
                <Col xs={2}>
                    <p>App Theme</p>
                </Col>
                <Col xs={22}>
                    <RadioGroup
                        inline={true}
                        value={appTheme}
                        onChange={setAppTheme}
                    >
                        <Radio value="light">
                            ☀️ Light
                        </Radio>
                        <Radio value="dark">
                            🌙 Dark
                        </Radio>
                    </RadioGroup>
                    <HelpBlock>Sometimes may not working, refresh should take the changes.</HelpBlock>
                </Col>
            </Row>

            <Row style={{ display: 'flex', alignItems: 'center', marginTop: 15 }}>
                <Col xs={2}>
                    <p>Actions</p>
                </Col>
                <Col xs={22} style={{ display: 'flex', flexDirection: 'row' }}>
                    <Uploader
                        fileListVisible={false}
                        autoUpload={false}
                        action=""
                        onChange={async (file) => {
                            setTask('import');
                            try {
                                root.db.importDatabase(file[0].blobFile, (state) => setProgressState({ ...state }));
                            } catch (error) {
                                setProgressState({ error, done: true });
                            }
                        }}
                    >
                        <Button>
                            <Icon icon="import" /> Import Data
                        </Button>
                    </Uploader>
                    <Button
                        style={{ marginLeft: 10 }}
                        appearance="primary"
                        onClick={async () => {
                            setTask('export');
                            try {
                                const blob = await root.db.exportDatabase((state) => setProgressState({ ...state }))
                                download(blob, "geliver.json", "application/json");
                            } catch (error) {
                                setProgressState({ error, done: true });
                            }
                        }}
                    >
                        <Icon icon="export" /> Export Data
                    </Button>
                    <Button style={{ marginLeft: 10 }} appearance="primary" onClick={() => setDeleteConfirm(true)}>
                        <Icon icon="trash" /> Clear History
                    </Button>
                </Col>
            </Row>

            <Modal show={progressState !== undefined} overflow={false} size="xs">
                <Modal.Header closeButton={false}>
                    <Modal.Title>
                        <Icon
                            icon={task === 'export' ? "export" : "import"}
                            style={{ marginRight: 10 }}
                        />
                        {task === 'export' ? "Exporting" : "Importing"} Data
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ display: 'flex', justifyContent: 'center', flexDirection: 'row' }}>
                    <Progress.Circle
                        style={{ width: 120 }}
                        percent={Math.floor((progressState?.completedRows / progressState?.totalRows) * 100)}
                        status={progressState?.done ? (progressState.error ? "fail" : "success") : 'active'}
                    />
                    <dl style={{ marginLeft: 30 }}>
                        <dt>Num Of Tables:</dt>
                        <dd>{progressState?.totalTables}</dd>
                        <dt>Num Of Rows:</dt>
                        <dd>{progressState?.completedRows} / {progressState?.totalRows}</dd>
                    </dl>
                </Modal.Body>
                {
                    progressState?.error && (
                        <Message
                            type="error"
                            title="Import Error"
                            description={progressState?.error.message}
                        />
                    )
                }
                {
                    progressState?.done && (
                        <Modal.Footer>
                            <Button
                                appearance="primary"
                                onClick={() => {
                                    setProgressState(undefined);
                                }}
                            >
                                Close
                            </Button>
                        </Modal.Footer>
                    )
                }
            </Modal>


            <Modal backdrop={true} show={deleteConfirm} onHide={onClose} size="xs">
                <Modal.Header closeButton={false}>
                    <Modal.Title>
                        <Icon
                            icon="remind"
                            style={{ color: '#ffb300', marginRight: 10 }}
                        />
                        Clear histories
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Histories once cleared will not be recover anymore.
                    Are you sure want to proceed?
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        appearance="primary"
                        onClick={async () => {
                            Alert.info('Clearing histories ...');
                            try {
                                await root.db.clearHistory()
                                onClose();
                                Alert.success('Clear histories successfully');
                                root.view.historyController.refresh();
                            } catch (err) {
                                Alert.error("Error when clearing histories: ", err.message);
                            }
                        }}
                    >
                        Ok
                    </Button>
                    <Button onClick={onClose} appearance="subtle">
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        </Grid>
    )
}

export default Setting;