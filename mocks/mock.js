const dayjs = require("dayjs");
const generalCommands = [
    { command: "start", description: "Start" },
    { command: "app", description: "App" },
    { command: "my_id", description: "Mening id rqamim" },
    { command: "konkurs", description: "Konkurs" },
];
const adminCommands = [
    { command: "start", description: "Start" },
    { command: "shablon", description: "Shablon tayyorlash" },
    { command: "app", description: "App" },
    { command: "add_acc", description: "Acc qo'shish" },
    {
        command: "get_all_user",
        description: "Barcha foydalanuvchilar ro'yxatini olish",
    },
    {
        command: "get_user_by_id",
        description: "ID bo'yicha foydalanuvchini topish",
    },
    { command: "hisobla", description: "Hisoblash" },
    { command: "discount", description: "Chegirma e'lom qilish" },
    { command: "bonus", description: "Bonus e'lon qilish" },
    { command: "top5", description: "Top 5" },
    { command: "random", description: "Random 5" },
    { command: "free", description: "Qo'shimchalar" },
    { command: "send_msg_to_all", description: "Barcha foydalanuvchilarga habar jo'natish" },
];
const myCommands = [
    { command: "start", description: "Start" },
    { command: "app", description: "App" },
    { command: "report", description: "Hisobot" },
    { command: "payment", description: "To'lov" },
];
const tarifs = {
    3: '3 soat',
    6: '6 soat',
    12: '12 soat',
    24: '24 soat', 
    '12&night': 'Tungi tarif',
    '12_night': 'Tungi tarif',
}

let default_konkurs_data = {
    name: "",
    winners_count: null,
    start_time: null,
    end_time: null,
    prize: '',
    button_text: '',
    end_by_user_count: null,
    end_deadline: null,
    text: '',
    contestant: '[]',
};

module.exports = {
    adminCommands,
    myCommands,
    generalCommands,
    tarifs,
    default_konkurs_data
};
