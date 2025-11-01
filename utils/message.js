const moment = require('moment');
function formatMessage(username, message) {
    const timestamp = new Date().toISOString();
    return {
        username,
        message,
        timestamp: moment(timestamp).format('h:mm a')
    };
}

module.exports = formatMessage;