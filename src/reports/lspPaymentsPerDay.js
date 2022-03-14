const argv = require('minimist')(process.argv.slice(2));
const ctx = require('../context');
const utils = require('../utils')

async function query(lsp) {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset();
    now.setHours(now.getHours() - tzOffset / 60);
    const days = argv.d || argv.days;
    const nDaysAgo = new Date(now.setDate(now.getDate() - days));

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
    return utils.processDailyTotals(await ctx.lspDb(query));
}

execute()
    .then(res => {
        const header = [
            {id: 'date', title: 'Date'},
            {id: 'payments', title: 'LSP Payments'},
        ]

        const data = res.map(item => {
            return {
                date: `${item._id.month}/${item._id.day}/${item._id.year}`,
                payments: item.count
            }
        })
        utils.writeCSV('C:/users/mgrayum/ideaprojects/prod-mongo/stats/lsp-payments-per-day.csv', header, data);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    })

module.exports = {execute}
