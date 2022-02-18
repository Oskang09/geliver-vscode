import RootContext from '#/controller';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    Button, Modal, Input, Form, FormGroup,
    ControlLabel, FormControl, HelpBlock, Schema, Message, Loader
} from 'rsuite';

const { StringType } = Schema.Types

function ColletionModal({ open, selectedCollectionId, onClose }) {
    const ref = useRef();
    const root = useContext(RootContext);
    const [loader, setLoader] = useState(false);
    const [formValue, setFormValue] = useState({});
    const [error, setError] = useState(undefined);

    const modelValidator = Schema.Model({
        name: StringType().
            isRequired('Name is required'),
    });

    useEffect(() => {
        setFormValue({});
        if (selectedCollectionId) {
            (async function () {
                const collection = await root.db.getCollectionById(selectedCollectionId);
                setFormValue({
                    name: collection.name,
                    tag: collection.tag,
                });
            })()
        }
    }, [selectedCollectionId]);

    const onSubmit = async () => {
        const { hasError } = await ref.current.checkAsync();
        if (!hasError) {
            setError(undefined);
            setLoader(true);
            try {
                if (selectedCollectionId) {
                    await root.db.modifyCollectionById(selectedCollectionId, formValue.name, formValue.tag);
                } else {
                    await root.db.createCollection(formValue.name, formValue.tag);
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
        <Modal show={open} size="xs" onHide={onClose}>
            <Modal.Header closeButton={false}>
                <Modal.Title>{selectedCollectionId ? "Edit" : "Create"} Collection</Modal.Title>
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
                        <ControlLabel>Tag</ControlLabel>
                        <FormControl
                            name="tag"
                            accepter={Input}
                        />
                        <HelpBlock>
                            Tag is just for display purpse, usually for specify development, staging or production.
                            You can use as ur own recognize purpose.
                        </HelpBlock>
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
                    loader ? <Loader style={{ marginRight: 10 }} content={`${selectedCollectionId ? 'Updating' : 'Creating'} ...`} /> : (
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

export default ColletionModal;