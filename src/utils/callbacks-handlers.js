const { setupSendMessages } = require("./response");
const service = require("../service/register.service");
const { calcTimeRange } = require("../utils/services");
const path = require("path");
const statePath = path.join(process.cwd(), 'mocks/state.js');
const state = require(statePath);
const {
    ownersChatId,
} = require("../../mocks/security");
const tarifs = require("../../mocks/mock").tarifs;
const o_controller = require("../controller/order.controller");
const db = require("../service/query.service");
const { setupExtras } = require("./extras");
const { setupOrders } = require("./order");
const { setupReports } = require("./report-handlers");
const { bonuses, winners } = state;
require("dotenv").config();

const dbName = process.env.DB_NAME;
const setupCallbackHandlers = (bot) => {
    if (!bot) {
        throw new Error("Bot or service is not provided correctly.");
    }
    const {
        checkWinners,
        sendMessage,
        sendVideo,
        deleteMessage,
    } = setupSendMessages(bot);

    const accept_rules = async (callbackQuery) => {
        const userId = callbackQuery.from.id;
        const videoPath = 'https://t.me/ATOMIC_ARENDA/22';
        const msg = `*ROYXATDAN OTISH JUDA OSON VA ODDIY*\n\n*TUSHUNMAY QOLSANGIZ* 👇\n\n*YUQORIDAGI VIDEODA QANDAY OTISH KORSATIB UTILGAN!*`;
        const option = {
            caption: msg,
            parse_mode: "Markdown",
        };
        sendVideo(userId, videoPath, option);

        const options = {
            reply_markup: {
                keyboard: [
                    [{ text: "Telefon raqamimni ulashish", request_contact: true }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
            parse_mode: "Markdown",
        };
        sendMessage(
            userId,
            "*Iltimos yuqoridagi videodagidek telefon raqamingizni ulashing*",
            options
        );
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Siz barcha qoidalarni qabul qildingiz!",
            show_alert: false,
        });
    };
    const done = async (callbackQuery) => {
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Allaqachon yakunlangan!",
            show_alert: false,
        });
    };
    const register_user = async (callbackQuery) => {
        const userId = callbackQuery.from.id;
        const existUser = await service.checkIfRegistered(userId);
        if (existUser) {
            return await bot.answerCallbackQuery(callbackQuery.id, {
                text: "Siz allaqachon ro'yxatdan o'tgansiz!",
                show_alert: true,
            });
        }
        const message = `
    \n*📌 DIQQAT📌*\n
    *❗️FAQAT IOS/ANDROID ✅*\n
    *❌EMULYATOR TAQIQLANADI❌*\n
    *❗️AKKAUNTDAN CHIQIB KETISH MUMKIN EMAS 📌*\n
    _Qaytib kirish niyatiz yoq bolsa yoki vaqtiz tugagandagina chiqing boshqa holatda chiqib ketib qolsangiz qayta pullik. Internetiz stabilniy bolsa oling faqat! internet ishlamay qolib chiqib ketsangiz bizda emas ayb!_\n
    *✅ NICK OZGARTIRISH MUMKIN ADMINDAN SORAB ✅*\n
    *❗️CHIT BILAN OYNASH TAQIQLANADI📌*\n
    *✅ PROVERKA QILINADI CHIT ANIQLANSA PULIZ QAYTARILMEDI VA BLOCKLANASIZ ❌*\n
    *⚠️AKKAUNT SIZ OYNAGAN VAQT ICHIDA BANGA KIRSA SIZ MAMURIY/JINOIY JAVOBGARLIKGA TORTILASIZ ⚠️⚠️⚠️*\n
      `;
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Roziman", callback_data: "accept_rules|" }],
                ],
            },
            parse_mode: "Markdown",
        };
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Ro'yaxtdan olish boshlandi!",
            show_alert: false,
        });
        bot.sendMessage(userId, message, options);
    };
    const konkurs = async (callbackQuery, dinamic) => {
        const userId = callbackQuery.from.id;
        const [action, type] = dinamic.split("_");
        if (action === "cancel") {
            bot
                .sendMessage(
                    userId,
                    `Yangi ro'yxat uchun ${type} ID lar ro'yxatini (,) bilan shu habarga javoban yozib jo'nating!`,
                    { parse_mode: "Markdown" }
                )
                .then((sentMessage) => {
                    bot.onReplyToMessage(userId, sentMessage.message_id, (reply) => {
                        const ids = reply.text?.split(" ").join("").split(",");
                        console.log(ids);

                        const message = ids?.map((user, index) => {
                            const formattedID = user.replace(/(\d{6})\d{2}/, "$1**");
                            const link = `[${formattedID}](tg://user?id=${formattedID})`;
                            return `*${index + 1}.* *ID:* ${link}`;
                        });
                        checkWinners(ids, userId, message, type);
                    });
                });
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Ro'yxat bekor qilindi!",
                show_alert: true,
            });
        } else {
            const ids = Object.values(winners)
                .sort((a, b) => a?.rank - b?.rank)
                .map((item) => item?.user_id);
            const message = ids.map((user, index) => {
                const formattedID = user.toString().replace(/(\d{6})\d{2}/, "$1**");
                const link = `[${formattedID}](tg://user?id=${formattedID})`;
                return `*${index + 1}.* *ID:* ${link}`;
            });
            checkWinners(ids, userId, message, type);
            bot.answerCallbackQuery(callbackQuery.id, {
                text: `${type} 5 tasdiqlandi!`,
                show_alert: false,
            });
        }
    };
    const about_bot = async (callbackQuery) => {
        const userId = callbackQuery.from.id;
        const message = `
        *🤖 Bot haqida*\n
        *🔹 Bot nimalar qila oladi:*\n
        *- Oldindan buyurtma berish*\n
        *-- Oldindan buyurtma berish uchun /app kommandasi yoki RENT ACCS tugmasi orqali programmamizni ochishingiz va u yerdan istagan akkountni tanlab isatlgan vaqt uchun sotib olishiungiz mumkun*\n
        *- Programma*\n
        *-- Programma orqali sizga kerakli akkountni tanlab sotib olishingiz  mening buyurtmalarim bo'limini ko'rishingiz mumkun*\n
        *- Bot orqali konkurs, chegirmalar va siz yoqtirgan akkountning bo'shash vaqtlari kabi eslatmalarni olasiz!*\n
        *- Shu bilan birga bot sotib oluvchilarning TOP5 va RANDOM5 konkurslarida g'olib bo'lganingiz haqida avtomatik ravishda habar beradi*\n
        *yoki /konkurs kommandasi orqali konkursda yutuq yutib yutmaganingizni tekshirsangiz bo'ladi*\n
        `;
        const options = {
            parse_mode: "Markdown",
        };
        sendMessage(userId, message, options);
    };
    const acc_number = async (callbackQuery, dinamic, form) => {
        const userId = callbackQuery.from.id;
        const acc_number = dinamic;
        form[userId] = { acc_number, order: "time" };
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Akkaunt qabul qilindi!",
            show_alert: false,
        });
        sendMessage(userId, "*Vaqtini raqam* _(1/1.5/2)_ *ko'rishinda kiriting:*", {
            parse_mode: "Markdown",
        });
    };
    const open_app = async (callbackQuery) => {
        const userId = callbackQuery.from.id;
        sendMessage(userId, "Ilovani ochish uchun /app kommandasini yoki RENT ACCS tugmasini bosing.");
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Ilovani ochish uchun /app kommandasini yoki RENT ACCS tugmasini bosing.",
            show_alert: false,
        });
    };
    const create_discount = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Chegirma yaratish aktivlashtirildi!",
            show_alert: false,
        });
        await bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            });
        const option = { reply_markup: { force_reply: true } };
        bot
            .sendMessage(chatId, "Necha foizlik chegirma elon qimoqchiligingizni shu habarga javoban faqat raqamlar bilan yozing:", option)
            .then((sentMessage) => {
                bot.onReplyToMessage(chatId, sentMessage.message_id, (reply) => {
                    bot.sendMessage(
                        chatId,
                        `Chegirma miqdori: ${reply.text}%\n\nChegirmaning amal qilish muddatini shu habarga javoban soat formatida yozing masalan: 24`,
                        option
                    ).then((sent_msg) => {
                        bot.onReplyToMessage(chatId, sent_msg.message_id, (reply2) => {
                            const options = {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: "Yo'q", callback_data: "reject_discount|" },
                                            { text: "Ha", callback_data: `accept_discount|${reply.text}_${reply2.text}` },
                                        ],
                                    ],
                                },
                            };
                            bot.sendMessage(chatId, `Chegirma miqdori: ${reply.text}%\nChegirmaning amal qilish muddati: ${reply2.text} soat\n\nChegirma aktivlashtirilsinmi?`, options);
                        })
                    })
                });
            });
    }
    const delete_discount = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Chegirma bekor qilish aktivlashtirildi!",
            show_alert: false,
        });
        await bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            });

        const discounts = await o_controller.getDiscounts();
        if (discounts.length > 0) {
            const options = {
                reply_markup: {
                    inline_keyboard: discounts.map((discount) => [
                        {
                            text: `${discount.amount}% - ${discount.deedline} gacha`,
                            callback_data: `delete_discount_by_id|${discount.discount_id}`,
                        },
                    ]),
                },
            };
            bot.sendMessage(chatId, "Bekor qilmoqchi bo'lgan chegirmangizni tanlang:", options);
        } else {
            bot.sendMessage(chatId, "Chegirmalar mavjud emas!");
        }
    }
    const delete_discount_by_id = async (callbackQuery, dinamic) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        const discount_id = dinamic;
        const s = await o_controller.deleteDiscount(discount_id);
        if (s) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Chegirma bekor qilindi!",
                show_alert: true,
            });
            bot.editMessageText(
                "Chegirma bekor qilindi!",
                {
                    chat_id: chatId,
                    message_id: message_id,
                }
            )
        } else {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Chegirma bekor qilishda muammo yuz berdi! Iltimos qayta urinib ko'ring.",
                show_alert: true,
            });
        }
    }
    const accept_discount = async (callbackQuery, dinamic) => {
        const userId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        if (ownersChatId.includes(userId)) {
            const [amount, deedline] = dinamic?.split("_");
            const values = { amount, deedline }
            const s = await o_controller.createDiscount(values);
            if (s) {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Chegirma e'lon qilindi!",
                    show_alert: true,
                });
                bot.editMessageText(
                    `Chegirma miqdori: ${amount}%\nChegirmaning amal qilish muddati: ${deedline} soat\n\nChegirma aktivlashtildi!`,
                    {
                        chat_id: userId,
                        message_id: message_id,
                    }
                )
            } else {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Chegirma e'lon qilishda muammo yuz berdi! Iltimos qayta urinib ko'ring.",
                    show_alert: true,
                });
            }
        }
    }
    const reject_discount = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;

        await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Chegirma bekor qilindi!",
            show_alert: false,
        });
        bot.editMessageText(
            "Chegirma bekor qilindi!",
            {
                chat_id: chatId,
                message_id: message_id,
            }
        )
    };
    const create_bonus = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Bonus yaratish aktivlashtirildi!",
            show_alert: false,
        });
        await bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            });
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "3 soatlik", callback_data: `bonus|3` }],
                    [{ text: "6 soatlik", callback_data: `bonus|6` }],
                    [{ text: "12 soatlik", callback_data: `bonus|12` }],
                    [{ text: "24 soatlik", callback_data: `bonus|24` }],
                    [{ text: "Tungi Tarif", callback_data: `bonus|12&night` }],
                ],
            },
        };
        bot.sendMessage(chatId, "Qaysi tarif uchun bonus elon qilmoqchisiz?", options)
    }
    const passive_bonus = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Chegirma bekor qilish aktivlashtirildi!",
            show_alert: false,
        });
        await bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            });

        const { group_data: bonuses } = await o_controller.getActiveBonuses();
        if (bonuses.length > 0) {
            bonuses.map((bonus) => {
                const details = bonus.map((item) => {
                    return `${tarifs[item.tarif]} + ${item.amount}`
                }).join("\n")
                const message = `*Paket nomi: ${bonus[0].collection_name}\n\n${details}*`;
                const options = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "OFF ❌", callback_data: `passive_bonus_by_id|${bonus[0].collection_name}` },
                            ],
                        ],
                    },
                    parse_mode: "Markdown",
                };
                sendMessage(chatId, message, options);
            });
        } else {
            bot.sendMessage(chatId, "Aktiv bonuslar mavjud emas!");
        }
    }
    const passive_bonus_by_id = async (callbackQuery, dinamic) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        const tarif = dinamic;
        const s = await o_controller.passiveBonus(tarif);
        if (s) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Bonus bekor qilindi!",
                show_alert: true,
            });
            bot.editMessageText(
                "Bonus bekor qilindi!",
                {
                    chat_id: chatId,
                    message_id: message_id,
                }
            )
        } else {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Bonus bekor qilishda muammo yuz berdi! Iltimos qayta urinib ko'ring.",
                show_alert: true,
            });
        }
    }
    const delete_bonus = async (callbackQuery, dinamic) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        const s = await o_controller.deleteBonus(dinamic);
        if (s) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Bonus Paketi o'chirildi!",
                show_alert: true,
            });
            deleteMessage(chatId, message_id);
        } else {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Bonus paketini o'chirishda muammo yuz berdi! Iltimos qayta urinib ko'ring.",
                show_alert: true,
            });
        }
    }
    const bonus = async (callbackQuery, dinamic) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        const process = isNaN(callbackQuery.message.text.split("\n")[0].split(" ")[2]?.split(",")?.join("")) ? "" : callbackQuery.message.text.split("\n")[0].split(" ")[2];
        console.log(process, "-", callbackQuery.message.text.split("\n")[0].split(" ")[2]);

        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Tarif tanlandi!",
            show_alert: false,
        });

        await bot.editMessageText(
            `${tarifs[dinamic]}lik tarif uchun bonus miqdorini faqat raqamlar bilan shu habarga javoban yozing:`,
            {
                chat_id: chatId,
                message_id: message_id,
            }
        ).then((sentMessage) => {
            bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                bonuses = [...bonuses, { tarif: dinamic, amount: reply.text }];
                const done_text = bonuses.map((bonus) => `${bonus.tarif}&${bonus.amount}`).join("_");
                const options = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "3 soatlik", callback_data: `bonus|3` }],
                            [{ text: "6 soatlik", callback_data: `bonus|6` }],
                            [{ text: "12 soatlik", callback_data: `bonus|12` }],
                            [{ text: "24 soatlik", callback_data: `bonus|24` }],
                            [{ text: "Tungi Tarif", callback_data: `bonus|12&night` }],
                            [{ text: "✅", callback_data: `next_bonus|${done_text}` }],
                        ],
                    },
                };
                await bot.sendMessage(
                    chatId,
                    `Tanlangan tariflar: ${process ? `${process},${dinamic}101${reply.text}` : `${dinamic}101${reply.text}`}\nBonus miqdori: ${reply.text} soat\n\nYana qaysi tarif uchun bonus e'lon qilmoqchisiz?`,
                    options
                );
            });
        });
    };
    const next_bonus = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Bonus tanlash yakunlandi!",
            show_alert: false,
        });
        const ids = callbackQuery.message.text.split("\n")[0].split(": ")[1];
        const bonuses = ids.split(",");
        let tarifs_text = "";
        for (let i = 0; i < bonuses.length; i++) {
            const [tarif, amount] = bonuses[i].split("101");
            tarifs_text += `${tarifs[tarif]} + ${amount} soat\n`;
        }

        bot.editMessageText(
            `${tarifs_text}\nBonuslarning amal qilish muddatini(soatini) raqamlar bilan shu habarga javoban yozing masalan: 24`,
            {
                chat_id: chatId,
                message_id: message_id,
            }
        ).then((sent_msg) => {
            bot.onReplyToMessage(chatId, sent_msg.message_id, (reply) => {
                const params = reply.text
                bot.sendMessage(chatId, 'Bonus nomini shu habarga javoban yozing:', { reply_markup: { force_reply: true } }).then((inn_send_msg) => {
                    bot.onReplyToMessage(chatId, inn_send_msg.message_id, (reply2) => {
                        const options = {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: "Yo'q", callback_data: "reject_bonus|" },
                                        { text: "Ha", callback_data: `accept_bonus|${params}_${reply2.text}` },
                                    ],
                                ],
                            },
                        };
                        sendMessage(chatId, `ID: ${ids}\nBonus paket nomi: ${reply2.text}\n${tarifs_text}\nBonuslarning amal qilish muddati: ${params} soat\n\nBonus aktivlashtirilsinmi?`, options);
                    })
                })
            })
        })
    }
    const reject_bonus = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;

        await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Bonus bekor qilindi!",
            show_alert: false,
        });
        bot.editMessageText(
            "Bonus bekor qilindi!",
            {
                chat_id: chatId,
                message_id: message_id,
            }
        )
    };
    const accept_bonus = async (callbackQuery, dinamic) => {
        const userId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        if (ownersChatId.includes(userId)) {
            const ids = callbackQuery.message.text.split("\n")[0].split(": ")[1];
            const bonuses = ids.split(",");
            let tarifs_text = "";
            let s = false;
            const [deadline, collection_name] = dinamic.split("_");
            for (let i = 0; i < bonuses.length; i++) {
                const [tarif, amount] = bonuses[i].split("101");
                tarifs_text += `${tarif} soat + ${amount}\n`;
                const values = { collection_name, tarif: tarif?.split("&").join("_"), amount, deedline: deadline }
                s = await o_controller.createBonus(values);
            }

            await db.createEvent(
                dbName,
                `bonus_timer_${collection_name}`,
                s,
                `UPDATE bonus SET status = 0 WHERE tarif = '${collection_name}';`
            );

            if (s) {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Bonus e'lon qilindi!",
                    show_alert: true,
                });
                bot.editMessageText(
                    `${collection_name} bonus paketi\n${tarifs_text}\nBonusning amal qilish muddati: ${deadline} soat\n\nBonus aktivlashtirildi!`,
                    {
                        chat_id: userId,
                        message_id: message_id,
                    }
                )
            } else {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Bonus e'lon qilishda muammo yuz berdi! Iltimos qayta urinib ko'ring.",
                    show_alert: true,
                });
            }
        }
    }
    const manage_bonus = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const bonuses = await o_controller.getBonusesList();
        if (bonuses.length === 0) return bot.sendMessage(chatId, "Bonuslar mavjud emas!");
        bonuses.map((bonus) => {
            const details = bonus.map((item) => {
                return `${tarifs[item.tarif]} + ${item.amount}`
            }).join("\n")
            const message = `*Paket nomi: ${bonus[0].collection_name}\n\n${details}*`;
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "DELETE 🗑", callback_data: `delete_bonus|${bonus[0].collection_name}` },
                            { text: "ON ✅", callback_data: `activate_bonus|${bonus[0].collection_name}` },
                        ],
                    ],
                },
                parse_mode: "Markdown",
            };
            sendMessage(chatId, message, options);
        });

        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Bonuslar ro'yxati yuborildi!",
            show_alert: false,
        });

    };
    const activate_bonus = async (callbackQuery, dinamic) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        const option = { parse_mode: "Markdown", reply_markup: { force_reply: true } };
        bot.sendMessage(chatId, "*Bonusning amal qilish muddatini(soatini) raqamlar bilan shu habarga javoban yozing masalan: 24*", option).then((sent_msg) => {
            bot.onReplyToMessage(chatId, sent_msg.message_id, async (reply) => {
                const s = await o_controller.activateBonus(dinamic, reply.text);
                if (s) {
                    bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Bonus aktivlashtirildi!",
                        show_alert: true,
                    });
                    sendMessage(chatId, "Bonus aktivlashtirildi!", { reply_to_message_id: message_id });
                } else {
                    bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Bonus aktivlashtirishda muammo yuz berdi! Iltimos qayta urinib ko'ring.",
                        show_alert: true,
                    });
                }
            })
        })
    }
    const edit_start_time = async (callbackQuery, dinamic, templateDatas) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        bot.sendMessage(
            chatId,
            `Boshlanish vaqtini shu habarga javoban (oy.kun-soat:daqiqa) sifatida yozing masalan: *01.01-00:00*`,
            { parse_mode: "Markdown", reply_markup: { force_reply: true } }
        ).then((sentMessage) => {
            bot.onReplyToMessage(chatId, sentMessage.message_id, (reply) => {
                const [time, hour] = reply.text?.split("-");
                const { action_hour, start_hour } = calcTimeRange(hour, false);
                templateDatas[dinamic] = {
                    ...templateDatas[dinamic],
                    month: time.split(".")[0],
                    day: time.split(".")[1],
                    start_hour,
                    action_hour,
                };
                const options = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "❌", callback_data: `edit_start_time|${dinamic}`, }, { text: "✅", callback_data: `accept_start_time|${dinamic}`, }],
                        ],
                    },
                    parse_mode: "Markdown",
                };
                bot.deleteMessage(chatId, message_id);
                bot.sendMessage(
                    chatId,
                    `Buyurtma boshlanishi vaqti: ${time} - ${start_hour}\nBand qilinish vaqti: ${time} - ${action_hour}\n\n Buni tasdiqlaysizmi?`,
                    options
                );
                return bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Shablon tayyor!",
                    show_alert: false,
                });
            });
        });
    }
    const accept_start_time = async (callbackQuery, dinamic) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        const bot_username = process.env.BOT_USERNAME;
        bot.sendMessage(
            chatId,
            `Harid shabloni tayyor 👇\n\n\`${bot_username} ${dinamic}\`\n\`${bot_username} ${dinamic}\`\n\`${bot_username} ${dinamic}\``,
            { parse_mode: "Markdown" }
        );

        bot.editMessageReplyMarkup(
            { inline_keyboard: [[],], },
            {
                chat_id: chatId,
                message_id: message_id,
            }
        );

        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Shablon tayyor!",
            show_alert: false,
        });

    }
    const pay = async (callbackQuery, dinamic) => {
        const userId = callbackQuery.from.id;
        const s = await service.updatePaymentStatus(dinamic);
        if (s) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "To'lov qabul qilindi!",
                show_alert: true,
            });
            return bot.sendMessage(userId, "To'lov qabul qilindi!");
        } else {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "To'lov qabul qilishda muammo yuz berdi! Iltimos qayta urinib ko'ring.",
                show_alert: true,
            });
        }
    };

    return {
        accept_rules,
        register_user,
        done,
        konkurs,
        about_bot,
        acc_number,
        open_app,
        create_discount,
        delete_discount,
        delete_discount_by_id,
        accept_discount,
        reject_discount,
        create_bonus,
        passive_bonus,
        passive_bonus_by_id,
        bonus,
        next_bonus,
        reject_bonus,
        accept_bonus,
        edit_start_time,
        accept_start_time,
        manage_bonus,
        activate_bonus,
        delete_bonus,
        pay,
        ...setupExtras(bot),
        ...setupOrders(bot),
        ...setupReports(bot),
    };
};

module.exports = {
    setupCallbackHandlers,
};
