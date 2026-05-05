const EventEmitter = require("events");
const sessionBus = new EventEmitter();
sessionBus.setMaxListeners(0);
module.exports = sessionBus;
