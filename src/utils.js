function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}

function lpad(str, len, padstr=" ") {
    var redExpr={$reduce:{
            input:{$range:[0,{$subtract:[len, {$strLenCP:str}]}]},
            initialValue:"",
            in:{$concat:["$$value",padstr]}}};
    return {$cond:{
            if:{$gte:[{$strLenCP:str},len]},
            then:str,
            else:{$concat:[ redExpr, str]}
        }};
}

function writeCSV(path, header, data) {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csvWriter = createCsvWriter({path, header});
    csvWriter
        .writeRecords(data)
        .then(()=> console.log('The CSV file was written successfully'));

}

function processDailyTotals(rawData) {
    rawData.sort((a, b) => (
        a._id.year - b._id.year || a._id.month - b._id.month || a._id.day - b._id.day
    ));

    return rawData.map(item => {
        const date = new Date(item._id.year, (item._id.month - 1), item._id.day);
        return{...item, dayOfWeek: date.getDay()}
    });
}

function processWeeklyTotals(dailyTotals) {
    const weeklyData = [];
    const firstMondayIndex = dailyTotals.findIndex(d => d.dayOfWeek === 1);

    dailyTotals.splice(0, firstMondayIndex);
    console.log(dailyTotals.map(d => ({...d, date: `${d._id.month}/${d._id.day}/${d._id.year}`})))

    const weeks = dailyTotals.filter(d => d.dayOfWeek === 0).length;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < weeks; i++) {
        const startOfWeek = `${dailyTotals[0]._id.month}/${dailyTotals[0]._id.day}/${dailyTotals[0]._id.year}`
        const sundayIndex = dailyTotals.findIndex(d => d.dayOfWeek === 0);
        const week = dailyTotals.splice(0, sundayIndex + 1);
        weeklyData[i] = {
            startOfWeek,
            count: week.map((w) => w.count).reduce((a, b) => a + b, 0)
        };
    }
    console.log({weeklyData})

    return weeklyData;
}

module.exports = {
    roundToTwo,
    lpad,
    writeCSV,
    processDailyTotals,
    processWeeklyTotals

}
