import RootContext from '#/controller';
import { usePagination } from '#/util/hooks';
import React, { useContext, useEffect, useState } from 'react';
import ScrollMenu from 'react-horizontal-scrolling-menu';
import { Alert, Button, Icon, IconButton, Modal, Panel, Tag } from 'rsuite';

function History({ setCurrent, setServerId, setEndpoint }) {
    const root = useContext(RootContext);
    const [deleteConfirm, setDeleteConfirm] = useState(undefined);
    const [controller, histories] = usePagination(root.db.listHistories);

    useEffect(() => {
        root.view.historyController = controller;
    }, [controller]);

    const onClickHistory = (history) => {
        setCurrent('history');
        setServerId(history.serverId);
        setEndpoint(history.endpoint);
        root.view.setRequestJSON(history.request);
        root.view.setResponseJSON(history.response);
    };

    const onClose = () => {
        setDeleteConfirm(undefined);
    };

    let ScrollMenuComponent = ScrollMenu;
    if (import.meta.env.PROD) {
        ScrollMenuComponent = ScrollMenu.default
    }

    return (
        <>
            {
                histories?.length > 0 ? (
                    <ScrollMenuComponent
                        onLastItemVisible={controller?.loadMore}
                        alignCenter={false}
                        itemStyle={{ outline: 'none' }}
                        data={histories.map(history => (
                            <div key={history.id} style={{ margin: 10 }}>
                                <Panel bordered={true} className="history-panel" onClick={() => onClickHistory(history)}>
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        {
                                            history.isError
                                                ? <Tag color="red">ERROR</Tag>
                                                : <Tag color="green">SUCCESS</Tag>
                                        }
                                        <p style={{ marginLeft: 5 }}>
                                            ( {history.endpoint} ) {history.name}
                                        </p>
                                        <IconButton
                                            style={{ marginLeft: 5 }}
                                            appearance="subtle"
                                            icon={<Icon icon="trash" />}
                                            onClick={() => setDeleteConfirm(history.id)}
                                        />
                                    </div>
                                </Panel>
                            </div>
                        ))}
                    />
                ) : (
                    <h4 style={{ textAlign: 'center' }}>You don't have any history yet. Start with your first request now!</h4>
                )
            }
            <Modal backdrop={true} show={deleteConfirm !== undefined} onHide={onClose} size="xs">
                <Modal.Header closeButton={false}>
                    <Modal.Title>
                        <Icon
                            icon="remind"
                            style={{ color: '#ffb300', marginRight: 10 }}
                        />
                        Delete history
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    History once deleted will not be recover anymore.
                    Are you sure want to proceed?
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        appearance="primary"
                        onClick={async () => {
                            Alert.info('Deleting history ...');
                            try {
                                await root.db.deleteHistoryById(deleteConfirm)
                                onClose();
                                Alert.success('Delete history successfully');
                                controller.refresh();
                            } catch (err) {
                                Alert.error("Error when deleting history: ", err.message);
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
        </>
    );
}

export default History;