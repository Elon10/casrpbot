const datetimeDifference = require("datetime-difference");
const moment = require("moment");

const a = moment(new Date()).format('l, hh:mm:ss a');

const start = new Date();
const end = new Date(a);


const among = datetimeDifference(start, end);
const idk = Object.keys(among)
    .filter(k => !!among[k])
    .map(k => `${ among[k] } ${ k }`)
    .join(", ");

console.log(idk);