const ctx = require('../context');
const serversTrained = require('../queries/totalServersTrained');
const utils = require('../utils')

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
            {$match: {'program.mapping.courseName': {$exists: true}, 'program.requestId': {$ne: 13}}},
            {$project: {course: {$concat: [
                utils.lpad({$toString: '$program.requestId'}, 9, '0'), ',', '$program.mapping.courseGeoLocation', ',' , '$program.mapping.courseName']}}},
            {$sortByCount: '$course'}
        ]);

    return result.toArray();
}

async function execute() {
   const totalServersTrainedResponse = await ctx.providerMgmtDb(serversTrained.query);
   const totalServersTrained = totalServersTrainedResponse[0].totalTrained;
   const serversTrainedPerTp = await ctx.providerMgmtDb(query);

   return serversTrainedPerTp.map(s => ({ ...s, percentageOfTotal: `${utils.roundToTwo((s.count/totalServersTrained)*100, 2)}%` }));
}

execute()
    .then(res => {
        const header = [
            {id: 'appid', title: 'App ID'},
            {id: 'location', title: 'Location'},
            {id: 'name', title: 'Course Name'},
            {id: 'count', title: 'Servers Trained'},
            {id: 'percentage', title: '% of All Trained Servers'},
        ]

        const data = res.map(tp => {
            const idParts = tp._id.split(',');
            return {
                appid: idParts[0].toString(),
                location: idParts[1],
                name: idParts[2],
                count: tp.count,
                percentage: tp.percentageOfTotal
            }
        })
        utils.writeCSV('C:/users/mgrayum/ideaprojects/prod-mongo/stats/servers-trained-per-tp.csv', header, data);

    })
    .catch(err => {
        console.error(err)
        process.exit(1);
    });

module.exports = {execute}
