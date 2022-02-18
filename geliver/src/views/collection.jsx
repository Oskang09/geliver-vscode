import RootContext from '#/controller';
import { PaginateEmptyPromise, usePagination } from '#/util/hooks';
import React, { useContext, useState } from 'react';
import ScrollMenu from 'react-horizontal-scrolling-menu';
import { Alert, Button, Dropdown, Icon, IconButton, Modal, Panel, Popover, Tag, Whisper } from 'rsuite';
import CollectionModal from '#/views/collection-modal';
import PresetModal from './preset-modal';

function Collection({ theme, setCurrent, setServerId, setEndpoint }) {
    const root = useContext(RootContext);
    const [deleteCollection, setDeleteCollection] = useState(undefined);
    const [deletePreset, setDeletePreset] = useState(undefined);
    const [editCollection, setEditCollection] = useState(undefined);
    const [selectedCollection, setSelectedCollection] = useState(undefined);
    const [editPreset, setEditPreset] = useState(undefined);
    const [selectedPreset, setSelectedPreset] = useState(undefined);
    const [collectionController, collections] = usePagination(root.db.listCollections);
    const [presetController, presets] = usePagination(
        (cursor) => {
            if (!selectedCollection) {
                return PaginateEmptyPromise;
            }
            return root.db.listPresetsByCollectionId(cursor, selectedCollection);
        },
    );

    let ScrollMenuComponent = ScrollMenu;
    if (import.meta.env.PROD) {
        ScrollMenuComponent = ScrollMenu.default
    }

    const onClickCollection = (collection) => {
        setSelectedCollection(collection.id);
        presetController.refresh();
    };

    const onClickPreset = (preset) => {
        setCurrent('preset');
        setServerId(preset.serverId);
        setEndpoint(preset.endpoint);
        root.view.setRequestJSON(preset.request);
        root.view.setResponseJSON({});
    };

    const onCreateCollection = () => {
        setEditCollection(true);
        setSelectedCollection(undefined);
    }

    const onEditCollection = (collection) => {
        setEditCollection(true);
        setSelectedCollection(collection.id);
    }

    const onCreatePreset = () => {
        setEditPreset(true);
        setSelectedPreset(undefined);
    }

    const onEditPreset = (preset) => {
        setEditPreset(true);
        setSelectedPreset(preset.id);
    }


    return (
        <>
            <CollectionModal
                open={editCollection}
                selectedCollectionId={selectedCollection}
                onClose={() => {
                    setEditCollection(undefined);
                    collectionController.refresh();
                }}
            />
            <PresetModal
                theme={theme}
                open={editPreset}
                selectedPresetId={selectedPreset}
                onClose={() => {
                    setEditPreset(undefined);
                    presetController.refresh();
                }}
            />
            <Modal backdrop={true} show={deleteCollection !== undefined} onHide={() => setDeleteCollection(undefined)} size="xs">
                <Modal.Header closeButton={false}>
                    <Modal.Title>
                        <Icon
                            icon="remind"
                            style={{ color: '#ffb300', marginRight: 10 }}
                        />
                        Delete collection
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Collection once deleted will not be recover anymore.
                    All of the preset under collection will be deleted also.
                    Are you sure want to proceed?
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        appearance="primary"
                        onClick={async () => {
                            Alert.info('Deleting collection ...');
                            try {
                                await root.db.deleteCollectionById(deleteCollection)
                                Alert.success('Delete collection successfully');
                                setDeleteCollection(undefined);
                                collectionController.refresh();
                            } catch (err) {
                                Alert.error("Error when deleting collection: ", err.message);
                            }
                        }}
                    >
                        Ok
                    </Button>
                    <Button onClick={() => setDeleteCollection(undefined)} appearance="subtle">
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal backdrop={true} show={deletePreset !== undefined} onHide={() => setDeletePreset(undefined)} size="xs">
                <Modal.Header closeButton={false}>
                    <Modal.Title>
                        <Icon
                            icon="remind"
                            style={{ color: '#ffb300', marginRight: 10 }}
                        />
                        Delete preset
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Preset once deleted will not be recover anymore.
                    Are you sure want to proceed?
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        appearance="primary"
                        onClick={async () => {
                            Alert.info('Deleting preset ...');
                            try {
                                await root.db.deletePresetById(deletePreset)
                                Alert.success('Delete preset successfully');
                                setDeletePreset(undefined);
                                presetController.refresh();
                            } catch (err) {
                                Alert.error("Error when deleting preset: ", err.message);
                            }
                        }}
                    >
                        Ok
                    </Button>
                    <Button onClick={() => setDeletePreset(undefined)} appearance="subtle">
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
            <Button appearance="primary" onClick={onCreateCollection}>
                <Icon icon="plus" /> Create Collection
            </Button>
            <Button style={{ marginLeft: 15 }} appearance="primary" onClick={onCreatePreset}>
                <Icon icon="plus" /> Create Preset
            </Button>
            <div style={{ marginTop: 10, marginBottom: 10 }}>
                {
                    collections?.length > 0 ? (
                        <ScrollMenuComponent
                            onLastItemVisible={collectionController?.loadMore}
                            alignCenter={false}
                            itemStyle={{ outline: 'none' }}
                            data={collections.map(collection => (
                                <div key={collection.id} style={{ margin: 10 }}>
                                    <Panel
                                        style={selectedCollection === collection.id ? { border: '1px solid #4BB543' } : {}}
                                        className="folder-panel"
                                        onClick={() => onClickCollection(collection)}
                                        bordered={true}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
                                            {selectedCollection === collection.id ? <Icon icon="folder-open" /> : <Icon icon="folder" />}
                                            <p style={{ marginLeft: 10 }}>
                                                {collection.name} {collection.tag && <Tag style={{ marginLeft: 5 }}>{collection.tag}</Tag>}
                                            </p>
                                            <Whisper
                                                trigger="click"
                                                placement="bottom"
                                                speaker={(
                                                    <Popover full={true}>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item
                                                                icon={<Icon icon="edit" />}
                                                                onSelect={() => onEditCollection(collection)}
                                                            >
                                                                Edit
                                                            </Dropdown.Item>
                                                            <Dropdown.Item
                                                                icon={<Icon icon="trash" />}
                                                                onSelect={() => setDeleteCollection(collection.id)}
                                                            >
                                                                Delete
                                                            </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Popover>
                                                )}
                                            >
                                                <Icon style={{ marginLeft: 15 }} icon="ellipsis-h" />
                                            </Whisper>
                                        </div>
                                    </Panel>
                                </div>
                            ))}
                        />
                    ) : (
                        <h4 style={{ textAlign: 'center' }}>You don't have any collection yet. Create your first collection now!</h4>
                    )
                }
            </div>
            {
                selectedCollection && (
                    presets?.length > 0 ? (
                        <ScrollMenuComponent
                            onLastItemVisible={presetController?.loadMore}
                            alignCenter={false}
                            itemStyle={{ outline: 'none' }}
                            data={presets.map(preset => (
                                <div key={preset.id} style={{ margin: 10 }}>
                                    <Panel className="preset-panel" onClick={() => onClickPreset(preset)} bordered={true}>
                                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                            <p style={{ marginLeft: 5 }}>
                                                ( {preset.endpoint} ) {preset.name}
                                            </p>
                                            <Whisper
                                                trigger="click"
                                                placement="bottom"
                                                speaker={(
                                                    <Popover full={true}>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item
                                                                icon={<Icon icon="edit" />}
                                                                onSelect={() => onEditPreset(preset)}
                                                            >
                                                                Edit
                                                            </Dropdown.Item>
                                                            <Dropdown.Item
                                                                icon={<Icon icon="trash" />}
                                                                onSelect={() => setDeletePreset(preset.id)}
                                                            >
                                                                Delete
                                                            </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Popover>
                                                )}
                                            >
                                                <Icon style={{ marginLeft: 15 }} icon="ellipsis-h" />
                                            </Whisper>
                                        </div>
                                    </Panel>
                                </div>
                            ))}
                        />
                    ) : (
                        <h4 style={{ textAlign: 'center' }}>You don't have any preset yet. Create your first preset now!</h4>
                    )
                )
            }
        </>
    )
}

export default Collection;