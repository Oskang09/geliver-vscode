import React, { useContext, useEffect, useRef, useState } from 'react';
import RootContext from '#/controller';
import {
    Button, Modal, Input, Form, FormGroup,
    ControlLabel, FormControl, HelpBlock, Schema, Message, Loader, SelectPicker
} from 'rsuite';
import { JsonEditor } from 'jsoneditor-react/es';
import ace from 'brace';

const { StringType } = Schema.Types

function PresetModal({ theme, open, selectedPresetId, onClose }) {
    const ref = useRef();
    const requestRef = useRef();
    const root = useContext(RootContext);
    const [loader, setLoader] = useState(false);
    const [formValue, setFormValue] = useState({});
    const [error, setError] = useState(undefined);
    const [servers, setServers] = useState([]);
    const [collections, setCollections] = useState([]);
    const [endpoints, setEndpoints] = useState([]);
    const [collectionSearch, setCollectionSearch] = useState();
    const [serverSearch, setServerSearch] = useState();
    const [endpointSearch, setEndpointSearch] = useState();

    const modelValidator = Schema.Model({
        name: StringType().
            isRequired('Name is required'),
        collectionId: StringType().
            isRequired('Collection is required'),
        serverId: StringType().
            isRequired('Server is required'),
        endpoint: StringType().
            isRequired('Endpoint is required'),
    });

    useEffect(() => {
        setFormValue({});
        if (selectedPresetId) {
            (async function () {
                const preset = await root.db.getPresetById(selectedPresetId);
                requestRef.current.jsonEditor.set(preset.request);

                setFormValue({
                    name: preset.name,
                    collectionId: preset.collectionId,
                    serverId: preset.serverId,
                    endpoint: preset.endpoint,
                    request: preset.request,
                });
            })()
        }
    }, [selectedPresetId]);

    useEffect(() => {
        (async function () {
            const collections = await root.db.listCollectionsWithSearch(collectionSearch);
            setCollections(collections);
        })();
    }, [collectionSearch]);

    useEffect(() => {
        (async function () {
            const servers = await root.db.listServers(serverSearch);
            setServers(servers);
        })();
    }, [serverSearch]);

    useEffect(() => {
        (async function () {
            const endpoints = await root.db.listEndpoints(formValue.serverId, endpointSearch);
            setEndpoints(endpoints);
        })();
    }, [formValue.serverId, endpointSearch]);

    useEffect(() => {
        if (formValue.endpoint && !selectedPresetId) {
            const request = endpoints.find(x => x.endpoint === formValue.endpoint).request;
            const json = JSON.parse(request);
            requestRef.current.jsonEditor.set(json);
        }
    }, [formValue.endpoint]);

    const onSubmit = async () => {
        const { hasError } = await ref.current.checkAsync();
        if (!hasError) {
            setError(undefined);
            setLoader(true);
            try {
                const request = requestRef.current.jsonEditor.get();
                if (selectedPresetId) {
                    await root.db.modifyPresetById(selectedPresetId, formValue.name, formValue.collectionId, formValue.serverId, formValue.endpoint, request);
                } else {
                    await root.db.createPreset(formValue.name, formValue.collectionId, formValue.serverId, formValue.endpoint, request);
                }
                onClose();
            } catch (err) {
                setError(err);
            } finally {
                setLoader(false);
            }
        }
    };

    return (
        <Modal show={open} size="xs" onHide={onClose} size="md" overflow={false}>
            <Modal.Header closeButton={false}>
                <Modal.Title>{selectedPresetId ? "Edit" : "Create"} Preset</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form
                    ref={ref}
                    fluid={true}
                    model={modelValidator}
                    formValue={formValue}
                    onChange={setFormValue}
                >
                    <FormGroup>
                        <ControlLabel>Name</ControlLabel>
                        <FormControl
                            name="name"
                            accepter={Input}
                        />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Collection</ControlLabel>
                        <FormControl
                            name="collectionId"
                            accepter={SelectPicker}
                            block={true}
                            onSearch={setCollectionSearch}
                            data={collections?.map(({ name, id }) => ({
                                label: name,
                                value: id,
                            }))}
                        />
                        <HelpBlock>
                            Currently only support single layer grouping, nested is not supported.
                        </HelpBlock>
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Server</ControlLabel>
                        <FormControl
                            name="serverId"
                            accepter={SelectPicker}
                            block={true}
                            onSearch={setServerSearch}
                            data={servers?.map(({ name, id, connection }) => ({
                                label: `${name} ( ${connection} )`,
                                value: id,
                            }))}
                        />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Endpoint</ControlLabel>
                        <FormControl
                            name="endpoint"
                            accepter={SelectPicker}
                            block={true}
                            onSearch={setEndpointSearch}
                            data={endpoints?.map(({ endpoint }) => ({
                                label: endpoint,
                                value: endpoint,
                            }))}
                        />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Request</ControlLabel>
                        <JsonEditor
                            ref={requestRef}
                            htmlElementProps={{ style: { height: 500 } }}
                            mode="code"
                            theme={root.view.getAceTheme(theme)}
                            ace={ace}
                            value={{}}
                        />
                    </FormGroup>
                </Form>
                {
                    error && (
                        <Message type="error" showIcon={true} description={error.message} />
                    )
                }
            </Modal.Body>
            <Modal.Footer style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                {
                    loader ? <Loader style={{ marginRight: 10 }} content={`${selectedPresetId ? 'Updating' : 'Creating'} ...`} /> : (
                        <Button appearance="primary" onClick={onSubmit}>
                            Confirm
                        </Button>
                    )
                }
                <Button appearance="subtle" onClick={onClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default PresetModal;