const appRoot = require('app-root-path');
const argv = require('minimist')(process.argv.slice(2));
const ctx = require('../context');
const utils = require('../utils')

async function query(providerMgmt) {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset();
    const weeks = argv.w || argv.weeks;
    now.setHours(now.getHours() - tzOffset / 60);
    const nDaysAgo = new Date(now.setDate(now.getDate() - weeks * 7));

    const result = providerMgmt.collection(ctx.RUNTIME_APPLICATIONS)
        .aggregate([
            {
                $project: {
                    'status.pe': 1,
                    submittedDate: 1,
                    date: {
                        year: { $year: { $subtract: ['$submittedDate', tzOffset * 60000] } },
                        month: { $month: { $subtract: ['$submittedDate', tzOffset * 60000] } },
                        day: { $dayOfMonth: { $subtract: ['$submittedDate', tzOffset * 60000] } },
                    },
                },
            },
            {
                $match: {
                    'status.pe': 'APPROVED',
                    submittedDate: { $gte: nDaysAgo },
                },
            },
            {
                $group: {
                    _id: '$date',
                    count: { $sum: 1 },
                },
            },
        ]);

    return result.toArray();
}

async function execute() {
    const dailyTotals = utils.processDailyTotals(await ctx.providerMgmtDb(query));

    return utils.processWeeklyTotals(dailyTotals);
}

execute()
    .then(res => {
        const header = [
            {id: 'weekBeginning', title: 'Week Beginning'},
            {id: 'servers', title: 'New Approved Servers'},
        ]

        const data = res.map(item => {
            return {
                weekBeginning: item.startOfWeek,
                servers: item.count
            }
        })
	    console.log({appRoot});
        utils.writeCSV(`${appRoot}/stats/approved-servers-per-week.csv`, header, data);

    })
    .catch(err => {
        console.error(err)
        process.exit(1);
    });

module.exports = {execute}
