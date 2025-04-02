const {
    adminCommands,
    myCommands,
    generalCommands,
} = require("../../mocks/mock");
const security = require("../../mocks/security");
const service = require("../service/register.service");
const o_controller = require("../controller/order.controller");
const { parseTextSimple, generateId } = require("../utils/services");
const { setupSendMessages } = require("./response");
const { lobby, acc_data, mode } = require("../../mocks/state");

const dayjs = require("dayjs");

const setupEventHandlers = (bot, key) => {
    const db_name = key;
    if (!bot) {
        throw new Error("Bot or service is not provided correctly.");
    }

    bot.onText(/\/start/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userID = msg.from.id;
        const userName = msg.from.first_name;

        if (security[key]?.owners_chat_id.includes(userID)) {
            bot.setMyCommands(adminCommands, {
                scope: { type: "chat", chat_id: chatId },
            });
            bot.sendMessage(chatId, "Assalomu alaykum, Admin!");
        } else if (security[key]?.my_chat_id.includes(userID)) {
            bot.setMyCommands(myCommands, {
                scope: { type: "chat", chat_id: chatId },
            });
            bot.sendMessage(chatId, "Assalomu alaykum, User!");
        } else {
            bot.setMyCommands(generalCommands, {
                scope: { type: "chat", chat_id: chatId },
            });
            await service.addParticipant(chatId, key);
            const existUser = await service.checkIfRegistered(chatId, key);
            const options_registered = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "RO'YXATDAN O'TISH", callback_data: "register_user|" }],
                        [
                            {
                                text: "ARENDA ACCLARNI KO'RISH",
                                callback_data: "open_app|",
                            },
                        ],
                        [
                            {
                                text: "KANALGA O'TISH",
                                url: "https://t.me/ATOMIC_ARENDA",
                            },
                        ],
                    ],
                },
            };
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "ARENDA ACCLARNI KO'RISH",
                                callback_data: "open_app|",
                            },
                        ],
                        [
                            {
                                text: "KANALGA O'TISH",
                                url: "https://t.me/ATOMIC_ARENDA",
                            },
                        ],
                    ],
                },
            };
            const userMessage = `Assalomu alaykum, ${userName}!\nSizga qanday yordam bera olishim mumkin?`;
            if (existUser) {
                bot.sendMessage(chatId, userMessage, options);
            } else {
                bot.sendMessage(chatId, userMessage, options_registered);
            }
        }
    });
    bot.onText(/\/start (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userID = msg.from.id;
        const userName = msg.from.first_name;
        await service.addParticipant(chatId, key);

        if (security[key]?.owners_chat_id.includes(userID)) {
            bot.setMyCommands(adminCommands, {
                scope: { type: "chat", chat_id: chatId },
            });
            return;
        }

        bot.setMyCommands(generalCommands, {
            scope: { type: "chat", chat_id: chatId },
        });
        const existUser = await service.checkIfRegistered(chatId, key);
        const options_registered = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "RO'YXATDAN O'TISH", callback_data: "register_user|" }],
                    [
                        {
                            text: "ARENDA ACCLARNI KO'RISH",
                            callback_data: "open_app|",
                        },
                    ],
                    [
                        {
                            text: "KANALGA O'TISH",
                            url: "https://t.me/ATOMIC_ARENDA",
                        },
                    ],
                ],
            },
        };
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "ARENDA ACCLARNI KO'RISH",
                            callback_data: "open_app|",
                        },
                    ],
                    [
                        {
                            text: "KANALGA O'TISH",
                            url: "https://t.me/ATOMIC_ARENDA",
                        },
                    ],
                ],
            },
        };
        const userMessage = `Assalomu alaykum, ${userName}!\nSizga qanday yordam bera olishim mumkin?`;
        if (existUser) {
            const [param, time] = match[1]?.split("_");

            if (param === "jointlobby") {
                const end_time = dayjs(time);
                const now = dayjs();
                if (now.isAfter(end_time)) {
                    bot.sendMessage(chatId, "Afsuski ro'yxatga olish yakunlandi!");
                    return;
                }
                const existUserInLobby = lobby[key]?.find((item) => item.user_id === userID);
                if (existUserInLobby) {
                    return bot.sendMessage(chatId, "Siz allaqachon lobby uchun ro'yxatdan o'tgansiz! ✅");
                }
                await bot.sendMessage(chatId, "Lobby uchun ro'yxatga olindingiz! ✅");
                bot.sendMessage(chatId, "Lobbyga qatnashmoqchi bo'lgan akkonuntlaringizning ID sini faqat raqamlar bilan shu habarga javoban yuboring:\n\n*DIQQAT ⚠️\nLOBBYDA FAQAT ROYXATGA OLINGAN AKKOUNTLAR QATNASHISHI MUMKUN RO'YXATGA OLINMAGAN AKKOUNTLAR ADMIN TOMONIDAN LOBBYDAN CHETLASHTIRILADI*", {
                    reply_markup: { force_reply: true },
                    parse_mode: "Markdown"
                }).then((s) => {
                    const { message_id } = s;
                    bot.onReplyToMessage(chatId, message_id, async (msg) => {
                        const text = msg.text.replace(/\D/g, '');
                        const data = { user_id: userID, acc_id: text };
                        lobby[key]?.push(data);
                        bot.sendMessage(chatId, "Muvaffaqiyatli ro'yxatdan o'tdingiz! ✅");
                    });
                    bot.once("text", (msg) => {
                        const r_m = msg?.reply_to_message?.message_id;
                        if (!r_m) {
                            bot.sendMessage(chatId, "ID ni yuqoridagi habarga javoban yuboring");
                        }
                    });
                });
                return;
            }
            bot.sendMessage(chatId, userMessage, options);
        } else {
            const [param, time] = match[1]?.split("_");
            if (param === "joinlobby") {
                const end_time = dayjs(time).format("YYYY-MM-DD HH:mm:ss");
                await bot.sendMessage(chatId, `Lobbyda ishitirok etish uchun oldin ro'yxatdan o'tishingiz kerak!`);
                await bot.sendMessage(chatId, `Ro'yxatga ${end_time} da yakunlanadi!`);
            }

            bot.sendMessage(chatId, userMessage, options_registered);
        }
    });
    bot.onText(/\/id (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const id = match[1];

        try {
            const user = await service.fetchUserById(id, key);
            if (user) {
                const link = `[${user.user_id}](tg://user?id=${user.user_id})`;

                if (user.latitude && user.longitude) {
                    bot.sendLocation(chatId, user.latitude, user.longitude);
                }

                const caption = `*User ID*: ${link}\n*Name*: ${user.username || "no name"
                    }\n*Phone*: ${user.phone}`;

                bot.sendMessage(chatId, caption, { parse_mode: "Markdown" });
                try {
                    const photo = JSON.parse(user.photo)[0];
                    bot.sendPhoto(chatId, photo);
                } catch (error) {
                    console.log("Error while sending photo:", error);
                    bot.sendMessage(
                        chatId,
                        "Xatolik yuz berdi. Rasm yuborishda xatolik."
                    );
                }
            } else {
                bot.sendMessage(chatId, "Foydalanuvchi topilmadi.");
            }
        } catch (error) {
            console.error("Error while sending user data:", error);
            bot.sendMessage(chatId, "Xatolik yuz berdi.");
        }
    });
    bot.onText(/\/app/, (msg) => {
        const chatId = msg.chat.id;
        const webAppUrl = `https://bot.foodify.uz?chatId=${chatId}&&type=home&&mode=keyboard&&db_name=${db_name}`;
        // const webAppUrl = `https://r68qlmhf-5173.euw.devtunnels.ms?chatId=${5750925866}&&type=home&&mode=keyboard&&db_name=${db_name}`;
        bot.sendMessage(chatId, "Site ochish uchun pastdagi tugmani bosing:", {
            reply_markup: {
                keyboard: [
                    [{ text: "Platformani ochish", web_app: { url: webAppUrl } }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        });
    });
    bot.onText(/\/add_acc/, (msg) => {
        const chatId = msg.chat.id;
        mode[key] = "add";

        bot.sendMessage(chatId, "Accaount qo'shish modi faollashtirildi!");
        bot.sendMessage(
            chatId,
            "Accaount qo'shish uchun quyida ko'rsatilgan malumotlarni ko'rsatilgandek qilib qo'shing:"
        );
        const accDataMsg = `
\`\`\`
/acc_info
name: '',
description: '',
videoID: '',
price_list: {
'3 soat': '',
'6 soat': '',
'12 soat': '',
'24 soat': '',
'Tungi Tarif (20.00 - 10.00)': ''
}
\`\`\`
`;

        bot.sendMessage(chatId, accDataMsg, { parse_mode: "Markdown" });
    });
    bot.onText(/\/acc_info/, (msg) => {
        const chatId = msg.chat.id;
        const msgText = msg.text;
        Object.assign(acc_data[key], parseTextSimple(msgText));
        bot.sendMessage(chatId, "Accaount ma'lumotlari muvaffaqiyatli qo'shildi!");
        bot.sendMessage(chatId, "Endi 4 ta rasm yuboring!");
    });
    bot.onText(/\/daily_price_list (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const daily_price_list = JSON.parse(match[1]);
        Object.assign(acc_data[key], { ...acc_data[key], daily_price_list });
        bot.sendMessage(chatId, "Daily price list muvaffaqiyatli qo'shildi!");
        bot.sendMessage(
            chatId,
            "Accaount qo'shishni yakunlash uchun /end ni bosing!"
        );
    });
    bot.onText(/\/end/, (msg) => {
        const chatId = msg.chat.id;
        const id = generateId();
        if (!acc_data[key]?.price_list) {
            return bot.sendMessage(chatId, "Accaount ma'lumotlari to'liq emas!");
        }
        const s = service.addAcc(acc_data[key], id, key);
        if (s) {
            mode[key] = "dev";
            Object.assign(acc_data[key], {});
            return bot.sendMessage(chatId, "Accaount muvaffaqiyatli qo'shildi!");
        } else {
            mode[key] = "dev";
            Object.assign(acc_data[key], {});
            return bot.sendMessage(
                chatId,
                "Xatolik yuz berdi. Iltimos qayta urinib ko'ring!"
            );
        }
    });
    bot.onText(/\/my_id/, (msg) => {
        const chatId = msg.chat.id;
        const messageId = msg.message_id;
        bot.sendMessage(chatId, `Sizning id raqamingiz: \`${chatId}\``, {
            parse_mode: "Markdown",
            reply_to_message_id: messageId,
        });
    });
    bot.onText(/\/discount/, async (msg) => {
        const chatId = msg.chat.id
        if (security[key]?.owners_chat_id.includes(chatId)) {
            const discounts = await o_controller.getDiscounts(key);
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Chegirmalarni bekor qilish", callback_data: "delete_discount|" }],
                        [{ text: "Yangi chegirma e'lon qilish", callback_data: "create_discount|" }],
                    ],
                },
            };
            bot.sendMessage(chatId, `Active chegirmalar soni: ${discounts.length}`, options);
        } else {
            bot.sendMessage(chatId, "Bu buyruqni berish uchun sizda vakolat yo'q");
        }
    })
    bot.onText(/\/bonus/, async (msg) => {
        const chatId = msg.chat.id
        if (security[key]?.owners_chat_id.includes(chatId)) {
            const bonuses = await o_controller.getBonusesList(key);
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Bonus paketlarini boshqarish", callback_data: "manage_bonus|" }],
                        [{ text: "Bonuslarni bekor qilish", callback_data: "passive_bonus|" }],
                        [{ text: "Yangi bonus e'lon qilish", callback_data: "create_bonus|" }],
                    ],
                },
            };
            bot.sendMessage(chatId, `Mavjud bonus paketleri: ${bonuses.length}`, options);
        } else {
            bot.sendMessage(chatId, "Bu buyruqni berish uchun sizda vakolat yo'q");
        }
    })
    bot.onText(/\/free/, async (msg) => {
        const chatId = msg.chat.id
        if (security[key]?.owners_chat_id.includes(chatId)) {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Top 5", callback_data: "top5|" }],
                        [{ text: "Random", callback_data: "random|" }],
                        [{ text: "Konkurs yaratish", callback_data: "create_konkurs|" }],
                        [{ text: "Mening konkurslarim", callback_data: "my_konkurs|" }],
                        [{ text: "Lobby boshlatish", callback_data: "create_lobby|" }],
                    ],
                },
            };
            bot.sendMessage(chatId, `Qanday amal bajarmoqchisiz ?`, options);
        } else {
            bot.sendMessage(chatId, "Bu buyruqni berish uchun sizda vakolat yo'q");
        }
    });
    bot.onText(/\/report/, async (msg) => {
        const chatId = msg.chat.id
        if (security[key]?.owners_chat_id.includes(chatId) || security[key]?.my_chat_id.includes(chatId)) {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Kunlik", callback_data: "daily|" }],
                        [{ text: "Haftalik", callback_data: "weekly|" }],
                        [{ text: "Oylik", callback_data: "monthly|" }],
                        [{ text: "Barchasi", callback_data: "all_time|" }],
                        [{ text: "Vaqt oralig'i", callback_data: "custom_time|" }],
                        [{ text: "Acc ga ko'ra", callback_data: "id_by|" }],
                    ],
                },
            };
            bot.sendMessage(chatId, `Qanday hisobot olmoqchisiz ?`, options);
        } else {
            bot.sendMessage(chatId, "Bu buyruqni berish uchun sizda vakolat yo'q");
        }
    });
    bot.onText(/\/send_msg/, async (msg) => {
        const chatId = msg.chat.id;
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Ro'yxatdan o'tganlarga xabar yuborish", callback_data: "send_msg_to_all|" }],
                    [{ text: "Barcha foydalanuvchilarga xabar yuborish", callback_data: "send_msg_to_participants|" }],
                ],
            },
        }
        bot.sendMessage(chatId, `Kimga xabar yuborishni xohlaysiz ?`, options);
    });
    bot.onText(/\/test/, async (msg) => {
        const chatId = msg.chat.id;
        // console.log(chatId);
        bot.sendMessage(chatId, "starting test");

        // let data = {
        //   user_id: '5750925866',
        //   acc_id: '#V4',
        //   time: '3',
        //   paid: '78000',
        //   id: '886377',
        //   imgs: [
        //     'AgACAgIAAxkBAAISmmd32vFgIie5i_Z59Sk1lf_hHALlAAJP4zEbmvrAS7rC1dr5ImIlAQADAgADeQADNgQ'
        //   ],
        //   start_date: '2025.01.03',
        //   start_hour: '18:00',
        //   end_date: '2025.01.03',
        //   end_hour: '21:00'
        // }
        // const data = { acc_id: "#V8" }
        // const s = await o_controller.updateFullOrder(data, '886377');
        // const s = await o_controller.getReport("monthly");
        // console.log(s);

        try {
            // const options = {
            //     reply_markup: {
            //         inline_keyboard: [
            //             [{
            //                 text: "✅ Katıl",
            //                 url: "https://t.me/satoshkin_meetup_bot?start=joinlobby_3460930466",
            //             }]
            //         ],
            //     },
            // };
            // bot.sendMessage(deletedOrdersChatId, `Qanday amal bajarmoqchisiz ?`, options);
            // bot.sendMessage(chatId, "Test mavjud emas!");
        } catch (error) {
            console.log("hata:", error.message);
            bot.sendMessage(chatId, "Bir hata oluştu. Lütfen tekrar deneyin.");
        }
    });

};

module.exports = {
    setupEventHandlers,
};
