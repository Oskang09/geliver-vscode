import Dexie from 'dexie';
import { exportDB, importInto } from "dexie-export-import";
import { generateUNIQ } from '#/util/generator';
import moment from 'moment';

let db = new Dexie('geliver', { addons: [] });
db.version(1).stores({
    histories: '&id, serverId, endpoint, createdAt',
    servers: '&id, name, endpoints, updatedAt',
    collections: '&id, name, tag, updatedAt',
    presets: '&id, name, collectionId, serverId, endpoint, updatedAt',
});

const paginator = async (targetDB, cursor = "", orderKey = "id", reversed = true, limit = 10) => {

    if (cursor) {
        targetDB = targetDB.where(orderKey);
        if (reversed) {
            targetDB = targetDB.belowOrEqual(cursor)
        } else {
            targetDB = targetDB.aboveOrEqual(cursor)
        }
    }

    let query = targetDB.limit(limit + 1);
    if (reversed) {
        query = query.reverse();
    }

    const result = await query.sortBy(orderKey);
    let nextCursor = undefined;
    if (result.length === limit + 1) {
        nextCursor = result.pop()[orderKey];
    }
    return [result, nextCursor];
}

class DexieDB {

    constructor(root) {
        this.root = root;
    }

    exportDatabase = async (progressCallback = () => { }) => {
        const blob = await exportDB(db, { progressCallback });
        return blob
    }

    importDatabase = async (blob, progressCallback = () => { }) => {
        await db.delete();
        await db.open();
        await importInto(db, blob, { progressCallback })
    }

    checkServerIdValid = async (id) => {
        const value = await db.servers.where("id").equals(id).first();
        return value === undefined;
    }

    getCollectionById = async (collectionId) => {
        return db.collections.where('id').equals(collectionId).first();
    }

    getPresetById = async (presetId) => {
        return db.presets.where('id').equals(presetId).first();
    }

    getServerById = async (serverId) => {
        return db.servers.where('id').equals(serverId).first();
    }

    getServerNameById = async (serverId) => {
        const server = await db.servers.where('id').equals(serverId).first();
        return server?.name;
    }

    listServers = async (search) => {
        let query = db.servers;
        if (search) {
            query = query.where('name').startsWithAnyOf(search);
        }
        return query.limit(50).toArray();
    }

    listCollectionsWithSearch = async (search) => {
        let query = db.collections;
        if (search) {
            query = query.where('name').startsWithAnyOf(search);
        }
        return query.limit(50).toArray();
    }

    listEndpoints = async (serverId, search) => {
        if (!serverId) {
            return [];
        }
        const server = await db.servers.where('id').equals(serverId).first();
        let endpoints = server?.endpoints || [];
        if (search) {
            endpoints = endpoints.filter(x => x.endpoint.toLowerCase().includes(search.toLowerCase()));
        }
        return endpoints;
    }

    listCollections = async (cursor) => {
        return paginator(db.collections, cursor, 'name', false, 8);
    }

    listPresetsByCollectionId = async (cursor, collectionId) => {
        return paginator(
            db.presets.where('collectionId').equals(collectionId),
            cursor, 'name', false, 8
        );
    }

    listHistories = async (cursor) => {
        const connectionMapper = {};
        const loader = async (serverId) => {
            if (connectionMapper[serverId]) {
                return connectionMapper[serverId];
            }
            connectionMapper[serverId] = this.getServerNameById(serverId);
            return connectionMapper[serverId];
        };

        const [result, nextCursor] = await paginator(db.histories, cursor, 'createdAt', true, 8);
        const promiseArray = Promise.all(
            result.map(
                async (history) => Object.assign(history, {
                    name: await loader(history.serverId),
                })
            )
        );
        return [await promiseArray, nextCursor];
    }

    modifyServerEndpointsById = async (id, endpoints) => {
        await db.servers.where('id').equals(id).modify({
            endpoints, updatedAt: moment.utc().valueOf(),
        });
    }

    modifyServerById = async (id, name, connection, password, endpoints) => {
        await db.servers.where('id').equals(id).modify({
            name, connection, password, endpoints,
            updatedAt: moment.utc().valueOf(),
        });
    }

    modifyCollectionById = async (id, name, tag) => {
        await db.collections.where('id').equals(id).modify({
            name, tag,
            updatedAt: moment.utc().valueOf(),
        });
    }

    modifyPresetById = async (name, collectionId, serverId, endpoint, request) => {
        await db.presets.where('id').equals(id).modify({
            name, collectionId, serverId, endpoint, request,
            updatedAt: moment.utc().valueOf(),
        });
    }

    createCollection = async (name, tag) => {
        await db.collections.put({
            id: generateUNIQ(),
            updatedAt: moment.utc().valueOf(),
            name, tag,
        });
    }

    createPreset = async (name, collectionId, serverId, endpoint, request) => {
        await db.presets.put({
            id: generateUNIQ(),
            updatedAt: moment.utc().valueOf(),
            name, collectionId, serverId, endpoint, request,
        })
    }

    createServer = async (id, name, endpoints) => {
        await db.servers.put({
            id, name, endpoints,
            updatedAt: moment.utc().valueOf(),
        });
    }

    createHistory = async (serverId, endpoint, request, response, isError) => {
        await db.histories.put({
            id: generateUNIQ(),
            serverId, endpoint, request, response, isError,
            createdAt: moment.utc().valueOf(),
        });
    }

    upsertPreset = async (id, name, serverId, endpoint, request) => {
        if (!id) {
            id = generateUNIQ();
        }
        await db.presets.put({
            id, name, serverId, endpoint, request,
            updatedAt: moment.utc().valueOf(),
        });
    }

    deletePresetById = async (id) => {
        await db.presets.where('id').equals(id).delete();
    }

    deleteCollectionById = async (id) => {
        await db.collections.where('id').equals(id).delete();
    }

    deleteHistoryById = async (id) => {
        await db.histories.where('id').equals(id).delete();
    }

    clearHistory = async () => {
        await db.histories.clear();
    }

}

export default DexieDB;