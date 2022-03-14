const appRoot = require('app-root-path');
const argv = require('minimist')(process.argv.slice(2));
const ctx = require('../context');
const utils = require('../utils')

async function query(lsp) {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset();
    now.setHours(now.getHours() - tzOffset / 60);
    const weeks = argv.w || argv.weeks;
    const nDaysAgo = new Date(now.setDate(now.getDate() - weeks * 7));

    const result = lsp.collection(ctx.PAYMENTS)
        .aggregate([
            {
                $project: {
                    status: 1,
                    createdDate: 1,
                    date: {
                        year: { $year: '$createdDate' },
                        month: { $month: '$createdDate' },
                        day: { $dayOfMonth: '$createdDate' },
                    },
                },
            },
            {
                $match: {
                    status: 'POSTED',
                    createdDate: { $gte: nDaysAgo },
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
    const dailyTotals = utils.processDailyTotals(await ctx.lspDb(query));

    return utils.processWeeklyTotals(dailyTotals);
}

execute()
    .then(res => {
        const header = [
            {id: 'weekBeginning', title: 'Week Beginning'},
            {id: 'payments', title: 'LSP Payments'},
        ]

        const data = res.map(item => {
            return {
                weekBeginning: item.startOfWeek,
                payments: item.count
            }
        })
        utils.writeCSV(`${appRoot}/stats/lsp-payments-per-week.csv`, header, data);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    })


module.exports = {execute}


