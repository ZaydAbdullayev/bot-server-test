require('dotenv').config();
const ownersChatId = JSON.parse(process.env.OWNERSCHATID);
const adminChatIds = JSON.parse(process.env.ADMINCHATIDS);
const myChatId = JSON.parse(process.env.MYCHATID);
const paidChanelId = process.env.PAIDCHANELID;
const deletedOrdersChatId = process.env.DELETEDORDERSCHATID;
const closedOrdersChatId = process.env.CLOSEDORDERSCHATID;
const askCancelChetId = process.env.ASKCANCELCHETID;
const newOrdersChatId = process.env.NEWORDERSCHATID;
const mainChannel = process.env.MAINCHANNEL;
const registeredUsersChatID = process.env.REGISTEREDUSERSCHATID;


module.exports = {
    ownersChatId,
    adminChatIds,
    myChatId,
    paidChanelId,
    deletedOrdersChatId,
    closedOrdersChatId,
    askCancelChetId,
    newOrdersChatId,
    mainChannel,
    registeredUsersChatID
};
