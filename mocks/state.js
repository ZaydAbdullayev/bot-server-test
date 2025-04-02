const default_konkurs_data = require("./mock").default_konkurs_data;

let mode = { arenda_1: {}, arenda_2: {}, arenda_3: {} };
let userInfo = { arenda_1: {}, arenda_2: {}, arenda_3: {} };
let acc_data = { arenda_1: {}, arenda_2: {}, arenda_3: {} };
let form = { arenda_1: {}, arenda_2: {}, arenda_3: {} };
let templateDatas = { arenda_1: {}, arenda_2: {}, arenda_3: {} };
let callballResult = { arenda_1: [], arenda_2: [], arenda_3: [] };
let winners = { arenda_1: {}, arenda_2: {}, arenda_3: {} };
let orderMsg = { arenda_1: {}, arenda_2: {}, arenda_3: {} };
let bonuses = { arenda_1: [], arenda_2: [], arenda_3: [] };
let lobby = { arenda_1: [], arenda_2: [], arenda_3: [] };
let konkurs_data = {
    arenda_1: { ...default_konkurs_data },
    arenda_2: { ...default_konkurs_data },
    arenda_3: { ...default_konkurs_data }
};
let test_data = {}
let cancelSending = { arenda_1: false, arenda_2: false, arenda_3: false };


module.exports = {
    mode,
    userInfo,
    acc_data,
    form,
    templateDatas,
    callballResult,
    winners,
    orderMsg,
    bonuses,
    lobby,
    konkurs_data,
    test_data,
    cancelSending
};