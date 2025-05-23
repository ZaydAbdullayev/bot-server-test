const http = require("http");
const socketIo = require("socket.io");
const TelegramBot = require("node-telegram-bot-api");
const service = require("./src/service/register.service");
const u_controller = require("./src/controller/user.controller");
const { setupSendMessages } = require("./src/utils/response");
const { setupCallbackHandlers } = require("./src/utils/callbacks-handlers");
const photoHandler = require("./src/utils/photo-handler");
require('dotenv').config();

const { generalCommands } = require("./mocks/mock");
const security = require("./mocks/security");
const {
    chunkArray,
    convertToTimeFormat,
} = require("./src/utils/services");
const handler = require("./src/utils/event-handler");
const path = require("path");
const fs = require("fs");
const { mode, userInfo, acc_data, form, templateDatas, callballResult } = require("./mocks/state");


const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, "imgs", req.url);
    const safePath = path
        .normalize(filePath)
        .startsWith(path.join(__dirname, "imgs"));
    if (!safePath) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("403 Forbidden");
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
            return;
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("500 Internal Server Error");
                return;
            }

            res.writeHead(200, { "Content-Type": "image/jpeg" });
            res.end(content);
        });
    });
});

const io = socketIo(server, {
    transports: ["websocket", "polling"],
    cors: {
        origin: "*",
    },
});

const bots = {};

security.tokens.forEach((config) => {
    bots[config.name] = new TelegramBot(config.token, { polling: true });
    dinamikCommandHandler(bots[config.name], config.name); // Dinamik olarak handler'ları ekliyoruz
});

function dinamikCommandHandler(bot, key) {
    const {
        sendMessagesToAdmins,
        sendMessage,
    } = setupSendMessages(bot, key);
    bot.setMyCommands(generalCommands);

    bot.on("polling_error", (error) => {
        console.error(`Polling error: ${error}`);
    });

    handler.setupEventHandlers(bot, key);

    bot.on("callback_query", async (callbackQuery) => {
        const userId = callbackQuery.from.id;
        const callbackData = callbackQuery.data;
        const function_name = callbackData.split("|");

        if (callbackData.startsWith("payment_order")) {
            setupCallbackHandlers(bot, key)[function_name[0]](
                callbackQuery,
                function_name[1],
                form[key]
            );
        } else if (function_name[0] === "new_order_accept") {
            const user_id = function_name[1].split("_")[0];
            mode[key][user_id] = "user_dev";
            setupCallbackHandlers(bot, key)[function_name[0]](
                callbackQuery,
                function_name[1]
            );
        } else if (function_name[0] === "acc_number") {
            setupCallbackHandlers(bot, key)[function_name[0]](
                callbackQuery,
                function_name[1],
                form[key]
            );
        } else if (function_name[0] === "form_accept") {
            setupCallbackHandlers(bot, key)[function_name[0]](
                callbackQuery,
                function_name[1],
                templateDatas[key]
            );
        } else if (function_name[0] === "cancel_shablon") {
            setupCallbackHandlers(bot, key)[function_name[0]](
                callbackQuery,
                function_name[1],
                templateDatas[key]
            );
        } else if (callbackData.startsWith("hisobla")) {
            const acc_number = callbackData.split("_")[1];
            let percent;
            switch (acc_number) {
                case "#V5":
                    percent = 1;
                    break;
                case "#V7":
                    percent = 1;
                    break;
                case "#T4":
                    percent = 1;
                    break;
                default:
                    percent = 1;
                    break;
            }
            const total_price1 = await service.calcPriceByAcc(acc_number, key);
            const total_price = total_price1
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            const moneyForOwner = (parseInt(total_price1) * percent)
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            sendMessage(
                userId,
                `*Sizning akkauntingiz ${acc_number}👇*\n\n*JAMI: ${total_price} so'm 🧾*\n\n*AKK EGASIGA: ${moneyForOwner} so'm ✅*`,
                { parse_mode: "Markdown" }
            );
            bot.answerCallbackQuery(callbackQuery.id, {
                text: `${acc_number} - ACCga oid mablag' hisoblangi!`,
                show_alert: false,
            });
        } else if (function_name[0] === "admin_accept") {
            setupCallbackHandlers(bot, key)[function_name[0]](
                callbackQuery,
                function_name[1],
                userInfo[key]
            );
        } else {
            setupCallbackHandlers(bot, key)[function_name[0]](
                callbackQuery,
                function_name[1]
            );
        }
    });

    bot.on("message", async (msg) => {
        const chatId = msg.from.id;
        const userId = msg.from.id;
        const username = msg.from.first_name;
        const command = msg.text;

        if (
            security[key]?.owners_chat_id?.includes(userId) ||
            security[key]?.my_chat_id?.includes(userId)
        ) {
            if (command === "/get_all_user") {
                const results = await service.fetchAllUsers(key);
                if (!results?.length) {
                    sendMessage(chatId, "Foydalanuvchilar topilmadi.");
                } else {
                    results.forEach((user, index) => {
                        const link = `[${user?.user_id}](tg://user?id=${user?.user_id})`;
                        setTimeout(() => {
                            sendMessage(
                                chatId,
                                `${index + 1}. ID: ${link}\nUsername: ${user?.username}\nPhone: ${user.phone
                                }`,
                                { parse_mode: "Markdown" }
                            );
                        }, index * 250);
                    });
                }
            } else if (command === "/get_user_by_id") {
                sendMessage(
                    chatId,
                    "*Iltimos ID raqamini (/id 0000000) sifatida yuboring:*",
                    { parse_mode: "Markdown" }
                );
            } else if (command === "/shablon") {
                const s = await u_controller.getAccsShortName(key)
                if (!s) return sendMessage(chatId, "Sizda accountlar mavjud emas!");
                form[key][chatId] = {};
                const chunkedAccData = chunkArray(s, 5);
                sendMessage(chatId, "*Akkaunt tanlang:*", {
                    reply_markup: {
                        inline_keyboard: chunkedAccData.map((chunk) =>
                            chunk.map((acc) => ({
                                text: acc,
                                callback_data: `acc_number|${acc}`,
                            }))
                        ),
                    },
                    parse_mode: "Markdown",
                });
            } else if (command === "/hisobla") {
                const s = await u_controller.getAccsShortName(key)
                if (!s) return sendMessage(chatId, "Sizda accountlar mavjud emas!");
                const chunkedAccData = chunkArray(s, 5);
                sendMessage(chatId, "Qaysi akkauntni hisoblamoqchisiz?", {
                    reply_markup: {
                        inline_keyboard: chunkedAccData.map((chunk) =>
                            chunk.map((acc) => ({
                                text: acc,
                                callback_data: `hisobla_${acc}`,
                            }))
                        ),
                    },
                });
            } else if (command === "/payment") {
                const s = await u_controller.getAccsShortName(key)
                const chunkedAccData = chunkArray(s, 5);
                sendMessage(chatId, "Qaysi akkauntni hisoblamoqchisiz?", {
                    reply_markup: {
                        inline_keyboard: chunkedAccData.map((chunk) =>
                            chunk.map((acc) => ({
                                text: acc,
                                callback_data: `pay|${acc}`,
                            }))
                        ),
                    },
                });
            }
        } else if (command === "/konkurs") {
            const s = await service.fetchWinner(chatId, key);
            if (s) {
                sendMessage(
                    chatId,
                    `Tabriklaymiz! Siz random tanlovda g'olib bo'ldingiz va ${s?.prize_time} soatga akkaunt olasiz!`
                );
            } else {
                sendMessage(chatId, "Siz g'olib bo'lmadingiz!");
            }
        } else if (msg?.web_app_data?.data) {
            const data = JSON.parse(msg.web_app_data.data);
            const id = data?.short_name;
            const existUser = await service.checkIfRegistered(chatId, key);
            if (existUser) {
                form[key][chatId] = { id, ...form[key][chatId], ...data };
                sendMessage(
                    chatId,
                    `*Endi Admin Buyurtmani Qabul Qilishini Kuting!*`,
                    {
                        parse_mode: "Markdown",
                    }
                );
                const formattedPrice = data?.price
                    ?.toString()
                    ?.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                sendMessage(
                    chatId,
                    `*Sizning buyurtmangiz:*\n\n*ACC №:* ${data.acc_name
                    } \n*NARX: ${formattedPrice} so'm* \n*START: ${new Date().getFullYear()}.${data.start_date}*\n*VAQTI: ${data.time} ${data.bonus ? ` + ${data.bonus}` : ""}*`,
                    { parse_mode: "Markdown" }
                );

                const link = `[${username}](tg://user?id=${chatId})`;
                const message = `*Yangi buyurtma №${id}*\n\nACC: ${data.acc_name
                    }\nNarxi: ${formattedPrice} so'm\nstart: ${data.start_date}\ndavomiyligi: ${data.time} ${data.bonus ? ` + ${data.bonus}` : ""}\n\n*Buyurtma beruvchi:* ${link} - ${chatId}`;

                const options = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "❌", callback_data: `new_order_reject|${chatId}` },
                                { text: "✅", callback_data: `new_order_accept|${chatId}` },
                            ],
                        ],
                    },
                    parse_mode: "Markdown",
                };
                bot.sendMessage(security[key]?.new_orders_chat_id, message, options).then((sentMessage) => {
                    const msg_id = sentMessage.message_id;
                    bot.editMessageReplyMarkup(
                        {
                            inline_keyboard: [
                                [
                                    {
                                        text: "❌",
                                        callback_data: `new_order_reject|${chatId}_${msg_id}`,
                                    },
                                    {
                                        text: "✅",
                                        callback_data: `new_order_accept|${chatId}_${msg_id}`,
                                    },
                                ],
                            ],
                        },
                        {
                            chat_id: security[key]?.new_orders_chat_id,
                            message_id: msg_id,
                        }
                    );
                });
            } else {
                sendMessage(
                    chatId,
                    `Iltimos buyurtma berishdan oldin ro'yxatdan o'ting! /start`
                );
            }
        } else if (userInfo[key][chatId]?.order === "photo" && msg.document) {
            sendMessage(chatId, "*PASSPORT XATO FORMATDA JONATILDI ❌*\n\n*ILTIMOS FAQAT RASM JONATING FILE TARZDA EMAS ✅*");
        }
    });

    bot.on("text", async (msg) => {
        const chatId = msg.from.id;
        const userId = msg.from.id;
        const isReply = msg.reply_to_message?.text || null;
        const us = form[key]?.[chatId] || {};
        const messageText = msg.text;
        const isNumeric = /^\d+$/.test(messageText);
        const value = messageText.replace(/[^\d.]/g, "");
        if (security[key]?.owners_chat_id?.includes(userId)) {
            if (us?.order === "time" && isNumeric) {
                form[key][chatId] = { ...form[key][chatId], time: value, order: "price" };
                sendMessage(
                    chatId,
                    `* Vaqt: ${convertToTimeFormat(value)} *\n* Endi To'lovni Kiriting:*`,
                    { parse_mode: "Markdown" }
                );
            } else if (us?.order === "price" && isNumeric) {
                mode[key][chatId] = "dev";
                form[key][chatId] = { ...form[key][chatId], price: value, order: "photo" };
                sendMessage(chatId, "*Iltimos to'lov checkini yuboring*", {
                    parse_mode: "Markdown",
                });
            } else if (isReply?.endsWith("yozing!")) {
                const user_id = isReply.match(/\d+/)[0];
                sendMessage(user_id, msg.text);
            } else if (isReply?.endsWith("yozing.")) {
                const user_id = isReply.match(/\d+/)[0];
                sendMessage(
                    user_id,
                    `*Kechirasiz, Sizning ma'lumotlaringiz qabul qilinmadi. Qayta urinib ko'ring* /start.`,
                    { parse_mode: "Markdown" }
                );
                sendMessage(user_id, `Admin javobi:\n${msg.text}`);
            }
        } else if (isNumeric || messageText.startsWith("+")) {
            bot.sendMessage(chatId, "*NOMER XATO FORMATDA JONATILDI ❌*\n\n*ILTIMOS PASTDAGI TUGMA ORQALI JONATING ✅*\n\n*TUSHUNMASANGIZ YUQORIDAGI VIDEODA KORSATILGAN 👆*");
        }
    });

    bot.on("inline_query", (query) => {
        const queryId = query.id;
        const queryText = query.query;
        const userId = query.from.id;

        if (security[key]?.admin_chat_ids.includes(userId)) {
            if (queryText === "") {
                bot.answerInlineQuery(queryId, []);
            } else {
                const uniqueCallballResult = callballResult[key]?.map((result, index) => ({
                    ...result,
                    id: `${result.id}-${queryId}-${index}`,
                }));
                const filteredResults = uniqueCallballResult.filter((result) => {
                    return result.title.includes(queryText);
                });
                bot.answerInlineQuery(queryId, filteredResults);
            }
        }
    });

    bot.on("contact", (msg) => {
        const chatId = msg.chat.id;
        if (msg.contact.phone_number) {
            userInfo[key][chatId] = {
                ...userInfo[key][chatId],
                phone: msg.contact.phone_number,
                order: "photo",
            };
            sendMessage(chatId, "*Passportingizning rasmni yuboring.*", {
                parse_mode: "Markdown",
            });
        } else {
            sendMessage(
                chatId,
                "*Mos bo'lmagan telefon raqami!*\nIltimos *Telefon raqamimni ulashish* tugmasi orqali telefon raqamingizni ulashing ulashing.",
                { parse_mode: "Markdown" }
            );
        }
    });

    const { adminSetup, userSetup } = photoHandler(bot, key);

    bot.on("photo", async (msg) => {
        const chatId = msg.chat.id;
        const img = msg.photo[msg.photo?.length - 1].file_id;
        const name = msg.chat.first_name;

        if (msg.chat.type !== "private") {
            sendMessage(chatId, "Bu özellik yalnızca özel sohbetlerde kullanılabilir.");
            return;
        }
        if (security[key]?.owners_chat_id.includes(chatId)) {
            adminSetup(
                chatId,
                form[key],
                mode[key],
                callballResult[key],
                templateDatas[key],
                img,
                acc_data[key]
            );
        } else {
            userSetup(chatId, form[key], mode[key], userInfo[key], name, img);
        }
    });

    bot.on("location", (msg) => {
        const chatId = msg.chat.id;
        userInfo[key][chatId] = { ...userInfo[key][chatId], location: msg.location };
        sendMessage(
            chatId,
            `Iltimos endi AKK JAVOBGARLIGINI OLAMAN degan video jo'nating, videoda gapirasiz:\n\n> Men, Ism Familiya, Tugilgan Sana, da tug'ilganman, ATOMIC ARENDA dan akk arenda olaman Akkauntga biron nima bolsa hammasini javobgarligini olaman\n
    `,
            {
                parse_mode: "MarkdownV2",
            }
        );
    });

    bot.on("video_note", (msg) => {
        const chatId = msg.chat.id;
        if (userInfo[key][chatId].photo?.length > 0 && userInfo[key][chatId].location != undefined) {

            userInfo[key][chatId] = {
                ...userInfo[key][chatId],
                video_note: msg.video_note.file_id,
                username: msg.from.username || null,
                userId: msg.from.id,
            };
            const link = `[${msg.from.first_name}](tg://user?id=${msg.from.id})`;

            const user = userInfo[key][chatId];
            const adminMessage = `Yangi Registiratsiya:\n— ism: ${user?.name}\n— tel: ${user?.phone}\n— user name: ${link}\n— user ID: ${user?.userId}`;
            sendMessagesToAdmins(user, adminMessage, true);
            sendMessage(
                chatId,
                "Barcha malumotlaringiz ko'rib chiqilmoqda. Iltimos admin tasdiqlashini kuting!"
            );
        } else {
            return sendMessage(chatId, "Iltimos sizdan talab qilingan ma'lumotlarni ketma-ketlikda yuboring!");
        }
    });

    bot.on("video", (msg) => {
        const chatId = msg.chat.id;
        if (!security[key]?.owners_chat_id.includes(chatId)) {
            if (mode[chatId] === "user_dev") {
                sendMessage(
                    chatId,
                    "*Iltimos check uchun video emas rasm yuboring!*\n*Yoki @ARENDA_BRO ga murojaat qiling!*",
                    { parse_mode: "Markdown" }
                );
            } else {
                sendMessage(chatId, "*Iltimos video emas video xabar jo'nating!!!*", {
                    parse_mode: "Markdown",
                });
            }
        }
    });

    bot.on("voice", (msg) => {
        const chatId = msg.from.id;
        const voice = msg.voice.file_id;
        const isReply = msg.reply_to_message?.text || null;
        if (security[key]?.owners_chat_id.includes(chatId)) {
            if (isReply?.endsWith("yozing.") || isReply?.endsWith("yuboring yoki yozing!")) {
                const user_id = isReply.match(/\d+/)[0];
                sendMessage(
                    user_id,
                    `*Kechirasiz, Sizning ma'lumotlaringiz qabul qilinmadi. Qayta urinib ko'ring* /start.`,
                    { parse_mode: "Markdown" }
                );
                bot.sendVoice(user_id, voice);
            } else if (isReply?.endsWith("jo'nating!")) {
                const user_id = isReply.match(/\d+/)[0];
                bot.sendVoice(user_id, voice);
            }
        }
    });
}

// user response
const { setupRouterkHandlers } = require("./router");
// io.on("connection", (socket) => {
// });

io.of(/^\/db-\w+$/).on("connection", async (socket) => {
    const namespace = socket.nsp.name;
    const dbName = namespace.replace("/db-", "");
    setupRouterkHandlers(socket, bots[dbName], dbName);
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    console.log(`starting ${Object.keys(bots).length} bots`);
});