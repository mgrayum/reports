const reports = require('./reports/index')

Object.entries(reports).forEach(report => report.execute())


