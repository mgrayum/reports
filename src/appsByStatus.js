const ctx = require('./context');
const argv = require('minimist')(process.argv.slice(2));

async function query(providerMgmt) {
    const result = providerMgmt.collection(ctx.RUNTIME_APPLICATIONS)
        .aggregate([
            {
                $match: {
                    templateId: argv.r || argv.role,
                    deleted: false,
                },
            },
            {
                $group: {
                    _id: '$status.pe',
                    count: { $sum: 1 },
                },
            },
        ]);

    return result.toArray();
}
ctx.providerMgmtDb(query)
    .then(res => console.table(res))
    .catch(err => console.error(err));
