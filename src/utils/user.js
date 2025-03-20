const { setupSendMessages } = require("./response");
const service = require("../service/register.service");
const {
    generateId,
    convertToTimeFormat,
    calculateEndDateTime,
    calcTimeRange,
} = require("../utils/services");
const {
    ownersChatId,
    closedOrdersChatId,
    paidChanelId,
    askCancelChetId,
    newOrdersChatId,
    deletedOrdersChatId,
    mainChannel,
} = require("../mocks/security");
const tarifs = require("../mocks/mock").tarifs;
const o_controller = require("../controller/order.controller");
const db = require("../service/query.service");

const setupOrders = (bot, winners) => {
    if (!bot) {
        throw new Error("Bot or service is not provided correctly.");
    }
    const {
        checkWinners,
        sendMessageForSuccess,
        sendMessage,
        sendVideoNote,
        sendLocation,
        sendVideo,
        deleteMessage,
        sendMessageForSuccessUpdate,
    } = setupSendMessages(bot, winners);
};