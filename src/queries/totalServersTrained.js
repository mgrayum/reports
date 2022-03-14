const ctx = require('../context');
const argv = require('minimist')(process.argv.slice(2));

async function query(providerMgmt) {
    const result = providerMgmt.collection(ctx.PROVIDERS_DATA)
        .aggregate([
            {$match: {templateId: 'server', trainingHistory: {$exists: true}}},
            {$project: {_id: 0, training: {$arrayElemAt: ['$trainingHistory', 0]}}},
            {$lookup: {
                    from: 'providersData',
                    localField: 'training.trainingProgramId',
                    foreignField: '_id',
                    as: 'program'
                }},
            {$project: {program: {$arrayElemAt: ['$program', 0]}}},
            {$group: {_id: null, totalTrained: {$sum: 1}}}
        ]);

    return result.toArray();
}

module.exports = { query };
