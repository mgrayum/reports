const mongo = require('mongodb').MongoClient;

const RUNTIME_APPLICATIONS = 'runtimeApplications';
const PROVIDERS_DATA = 'providersData';
const PAYMENTS = 'payments';

const MONGO_PORT = 27017;
const MONGO_USER = 'root';
const MONGO_PWD = 'SdqncHq4t8';

async function providerMgmtDb(query) {
    const url = `mongodb://${MONGO_USER}:${MONGO_PWD}@localhost:${MONGO_PORT}`;
    const db = await mongo.connect(url);
    const providerMgmt = db.db('providermgmt');

    const result = await query(providerMgmt);

    await db.close();

    return result;
}

async function lspDb(query) {
    let url = `mongodb://${MONGO_USER}:${MONGO_PWD}@localhost:${MONGO_PORT}`;
    const db = await mongo.connect(url);
    const lsp = db.db('licensing');

    const result = await query(lsp);

    await db.close();

    return result;
}

module.exports = {
    providerMgmtDb,
    lspDb,
    RUNTIME_APPLICATIONS,
    PROVIDERS_DATA,
    PAYMENTS
};
