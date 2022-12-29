const datetimeDifference = require("datetime-difference");

const date1 = new Date("Friday, December 23, 2022 11:48 AM");
const date2 = new Date("Friday, December 23, 2022 1:32 PM");

const result = datetimeDifference(date1, date2);

const readme = Object.keys(result)
    .filter(k => !!result[k])
    .map(k => `${ result[k] } ${ k }`)
    .join(", ");

console.log(readme);