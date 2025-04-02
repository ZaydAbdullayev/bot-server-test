const { setupSendMessages } = require("./response");
const service = require("../service/register.service");
const security = require("../../mocks/security");
const { winners, konkurs_data } = require("../../mocks/state");
const default_konkurs_data = require("../../mocks/mock").default_konkurs_data;
const u_controller = require("../controller/user.controller");
const db = require("../service/query.service");
const dayjs = require("dayjs");


const setupExtras = (bot, key) => {
    const dbName = key;
    if (!bot) {
        throw new Error("Bot or service is not provided correctly.");
    }
    const {
        sendMessage,
        deleteMessage,
    } = setupSendMessages(bot, key);

    const create_konkurs = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        if (security[key]?.owners_chat_id.includes(chatId)) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Konkurs yaratish boshlatildi!",
                show_alert: false,
            });
            bot
                .sendMessage(chatId, "Konkurs matini shu habarga javoban yozing:", {
                    reply_markup: { force_reply: true },
                })
                .then((sentMessage) => {
                    bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                        konkurs_data[key].text = reply.text;
                        await bot.sendMessage(chatId, "Konkurs matni saqlandi ✅");
                        bot
                            .sendMessage(chatId, "Tugma uchun matnni shu habarga javoban yozing:", {
                                reply_markup: { force_reply: true },
                            })
                            .then((sentMessage) => {
                                bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                                    konkurs_data[key].button_text = reply.text;
                                    await bot.sendMessage(chatId, "Tugma matni saqlandi ✅");
                                    bot
                                        .sendMessage(chatId, "Goliblar sonini su habarga javoban yozing", {
                                            reply_markup: { force_reply: true },
                                        })
                                        .then((sentMessage) => {
                                            bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                                                konkurs_data[key].winners_count = reply.text.replace(/\D/g, '');
                                                await bot.sendMessage(chatId, "Goliblar soni saqlandi ✅");
                                                bot
                                                    .sendMessage(chatId, "Konkurs bashlanish vaxtini (oy,kun soat:minut) formatida kiriting kiriting:\n *va agar konkurs konkurs habari kanalga jo'natishi bilan boshlanishini hohlasangiz `now` so'zini yozing*", {
                                                        reply_markup: { force_reply: true },
                                                        parse_mode: "Markdown",
                                                    })
                                                    .then((sentMessage) => {
                                                        bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                                                            const today = dayjs().format("YYYY-MM-DD HH:mm:ss");
                                                            konkurs_data[key].start_time = reply.text === "now" ? today : dayjs(reply.text).format("YYYY-MM-DD HH:mm:ss");
                                                            konkurs_data[key].end_time = today;
                                                            await bot.sendMessage(chatId, "Boshlanish vaqti saqlandi ✅");
                                                            const s = await u_controller.addKonkurs(konkurs_data[key], key);
                                                            if (!s) return bot.sendMessage(chatId, `Konkursni malumotlarini saqlashda kutilmagan xatolik yuz berdi ❌\nIltimos qaytadan urinib ko'ring /free`);
                                                            const options = {
                                                                reply_markup: {
                                                                    inline_keyboard: [
                                                                        [
                                                                            {
                                                                                text: "Qatnashuvchi soniga ko'ra",
                                                                                callback_data: `by_user_count|`,
                                                                            },
                                                                            {
                                                                                text: "Vaqtga ko'ra",
                                                                                callback_data: `by_deadline|`,
                                                                            },
                                                                        ],
                                                                    ],
                                                                },
                                                                parse_mode: "Markdown",
                                                            };
                                                            sendMessage(chatId, `Konkurs qanday yakunlansin?`, options)
                                                        });
                                                    });
                                            });
                                        });
                                });
                            });
                    });
                });

        } else {
            bot.sendMessage(chatId, "Bu buyruqni berish uchun sizda vakolat yo'q");
        }
    }
    const by_user_count = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            }
        );
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Konkurs foydalanuvchi soniga ko'ra yakunlanadi",
            show_alert: false,
        });
        bot
            .sendMessage(chatId, "Konkurs foydalanuvchilar soni nechiga yetkanda to'xtatilishi kerkligini shu habarga javoban yozing", {
                reply_markup: { force_reply: true },
            })
            .then((sentMessage) => {
                bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                    konkurs_data[key].end_by_user_count = reply.text.replace(/\D/g, '') || 3;
                    const s = await u_controller.updateKonkurs({ end_by_user_count: reply.text.replace(/\D/g, '') }, 0, key);
                    if (!s) return bot.sendMessage(chatId, `Konkursni malumotlarini saqlashda kutilmagan xatolik yuz berdi ❌\nIltimos qaytadan urinib ko'ring /free`);
                    await bot.sendMessage(chatId, "Konkursni tugatish usuli saqlandi ✅");
                    const options = {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Saqlash",
                                        callback_data: `accept_konkurs|`,
                                    },
                                ],
                                [
                                    {
                                        text: "Bekor qilish",
                                        callback_data: `reject_konkurs|`,
                                    },
                                ],
                                [
                                    {
                                        text: "Saqla va kanalga yubor",
                                        callback_data: `accept_send_konkurs|counter`,
                                    },
                                ],
                            ],
                        },
                        parse_mode: "Markdown",
                    };
                    const options_konkurs = {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: konkurs_data[key].button_text, callback_data: `join_to_konkurs|counter` }],
                            ],
                        },
                        parse_mode: "Markdown",
                    };
                    await sendMessage(chatId, konkurs_data[key].text, options_konkurs)
                    sendMessage(chatId, `Iltimos konkurs malumotlarini tekshiring:\n\nG'liblar soni: ${konkurs_data[key].winners_count}\n\nBoshlanish vaqti: ${konkurs_data[key].start_time}\n\nTugatish usuli:\nQatnashuvchi soni ${reply.text} taga yetganida`, options)
                });
            });
    };
    const by_deadline = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            }
        );
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Konkurs vaqtga ko'ra yakunlanadi",
            show_alert: false,
        });
        bot
            .sendMessage(chatId, "Konkurs (soat) davomiyligini shu habarga javoban raqamlar bilan yozing masalan (12/24/48):", {
                reply_markup: { force_reply: true },
            })
            .then((sentMessage) => {
                bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                    const deadline = reply.text.replace(/\D/g, '');
                    const start_time = dayjs().format("YYYY-MM-DD HH:mm:ss");
                    const end_time = dayjs().add(deadline, 'hour').format("YYYY-MM-DD HH:mm:ss");
                    konkurs_data[key].end_deadline = deadline;
                    konkurs_data[key].start_time = start_time;
                    konkurs_data[key].end_time = end_time;
                    const s = await u_controller.updateKonkurs({ end_deadline: deadline, start_time, end_time }, 0, key);
                    if (!s) return bot.sendMessage(chatId, `Konkursni malumotlarini saqlashda kutilmagan xatolik yuz berdi ❌\nIltimos qaytadan urinib ko'ring /free`);
                    await bot.sendMessage(chatId, "Konkursni tugatish usuli saqlandi ✅");
                    const options = {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Saqlash",
                                        callback_data: `accept_konkurs|`,
                                    },
                                ],
                                [
                                    {
                                        text: "Bekor qilish",
                                        callback_data: `reject_konkurs|`,
                                    },
                                ],
                                [
                                    {
                                        text: "Saqla va kanalga yubor",
                                        callback_data: `accept_send_konkurs|timer`,
                                    },
                                ],
                            ],
                        },
                        parse_mode: "Markdown",
                    };
                    const options_konkurs = {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: konkurs_data[key].button_text, callback_data: `join_to_konkurs|counter` }],
                            ],
                        },
                        parse_mode: "Markdown",
                    };
                    await sendMessage(chatId, konkurs_data[key].text, options_konkurs)
                    sendMessage(chatId, `Iltimos konkurs malumotlarini tekshiring:\n\nG'liblar soni: ${konkurs_data[key].winners_count}\n\nBoshlanish vaqti: ${konkurs_data[key].start_time}\n\nTugatish usuli:\n${reply.text} soatdan keyin`, options)
                });
            });
    }
    const accept_konkurs = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            }
        );
        bot.sendMessage(chatId, "Konkurs nomini shu habarga javoban yozing:", { reply_markup: { force_reply: true }, }).then((sentMessage) => {
            bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                konkurs_data[key].name = reply.text;
                const s = await u_controller.updateKonkurs({ name: reply.text, status: 1 }, 0, key);
                if (!s) {
                    bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Konkurs malumotlarini saqlashda kutilmagan hatolik yuz berdi ❌. Iltimos qayta urinib ko'ring",
                        show_alert: true,
                    });
                }
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Konkurs nomi qabul qilindi!",
                    show_alert: false,
                });
                await sendMessage(chatId, "Konkurs muvoffaqiyatli saqlandi ✅", {
                    reply_to_message_id: sentMessage.message_id,
                });
                konkurs_data[key] = default_konkurs_data;
            });
        });

    };
    const reject_konkurs = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;

        await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Konkurs bekor qilindi!",
            show_alert: true,
        });
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            }
        );
        sendMessage(chatId, "Konkurs bekor qilindi!", {
            reply_to_message_id: message_id,
        });
        konkurs_data[key] = default_konkurs_data;
    };
    const accept_send_konkurs = async (callbackQuery, type) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            }
        );
        bot.sendMessage(chatId, "Konkurs nomini shu habarga javoban yozing:", { reply_markup: { force_reply: true }, }).then((sentMessage) => {
            bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                konkurs_data[key].name = reply.text;
                const s = await u_controller.updateKonkurs({ name: reply.text, status: 2 }, 0, key);
                if (type === "timer") {
                    const timerSql = `UPDATE konkurs SET status = 1 WHERE name = '${reply.text}';`;
                    const endTime = dayjs(konkurs_data[key].end_time).subtract(4, 'hour').format("YYYY-MM-DD HH:mm:ss");
                    await db.createEvent(dbName, reply.text, endTime, timerSql)
                }

                if (!s) {
                    bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Konkurs malumotlarini saqlashda kutilmagan hatolik yuz berdi ❌. Iltimos qayta urinib ko'ring",
                        show_alert: true,
                    });
                }
                const options = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: konkurs_data[key].button_text, callback_data: `join_to_konkurs|${type}&${reply.text}` }],
                        ],
                    },
                    parse_mode: "Markdown",
                };
                await sendMessage(security[key].deleted_orders_chat_id, konkurs_data[key].text, options);
                sendMessage(chatId, "Konkurs saqlandi va Kanalga yuborildi!", {
                    reply_to_message_id: message_id,
                });
                Object.assign(konkurs_data[key], default_konkurs_data);
            });
        });
    };
    const join_to_konkurs = async (callbackQuery, dinamic) => {
        const chatId = callbackQuery.from.id;
        const existUser = await service.checkIfRegistered(chatId, key);
        if (existUser) {
            const [endType, name] = dinamic.split("&");
            const konkurs = await u_controller.getContestant(name, key);

            const contestant = JSON.parse(konkurs.contestant);
            if (contestant.includes(chatId) && konkurs.status === 2) {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Siz allaqachon konkurs ro'yxatdasiz!",
                    show_alert: true,
                })
                return;
            }
            if (endType === "timer") {
                const end_time = dayjs(konkurs.end_time);
                const now = dayjs();
                if (now.isAfter(end_time)) {
                    bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Afsuski Konkurs tugatildi!",
                        show_alert: true,
                    });
                    return;
                } else {
                    contestant.push(chatId);
                    const s = await u_controller.updateKonkurs({ contestant: JSON.stringify(contestant) }, 2, key);
                    if (!s) {
                        bot.answerCallbackQuery(callbackQuery.id, {
                            text: "Konkursga qo'shilishda xatolik yuz berdi ❌",
                            show_alert: true,
                        });
                    }
                }
            } else {
                if (contestant.length >= konkurs.end_by_user_count) {
                    bot.answerCallbackQuery(callbackQuery.id, {
                        text: `Afsuski bo'sh joy qolmagan!`,
                        show_alert: true,
                    });
                    return;
                } else {
                    contestant.push(chatId);
                    const s = await u_controller.updateKonkurs({ contestant: JSON.stringify(contestant) }, 2, key);
                    if (!s) {
                        bot.answerCallbackQuery(callbackQuery.id, {
                            text: "Konkursga qo'shilishda xatolik yuz berdi ❌",
                            show_alert: true,
                        });
                    }
                }
            }
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Siz konkurs ishtirokchisiga aylandingiz ✅",
                show_alert: true,
            });
        } else {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: `Qatnashish uchun ${security[key].bot_username} dan ro'yxatdan o'ting!`,
                show_alert: true,
            });
        }
    };
    const top5 = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const top5 = await service.rankUsersByTotalPayments(key);
        if (!top5.length) {
            sendMessage(chatId, "Foydalanuvchilar topilmadi.");
        } else {
            const message = top5.map((user, index) => {
                const link = `[${user?.user_id}](tg://user?id=${user.user_id})`;
                winners[key][user?.user_id] = user;
                return `${index + 1}. ID: ${link} - ${user?.total_spent} so'm`;
            });
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "❌", callback_data: "konkurs|cancel_Top" },
                            { text: "✅", callback_data: "konkurs|accept_Top" },
                        ],
                    ],
                },
                parse_mode: "Markdown",
            };
            sendMessage(
                chatId,
                [
                    "*Eng ko'p acc olgan TOP 5 talik *👇\n",
                    ...message,
                    "\n*Buni tasdiqlaysizmi ?*",
                ].join("\n"),
                options
            );
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Top 5 foydalanuvchilar aniqlandi!",
                show_alert: false,
            });
        }
    };
    const random = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const randomWinners = await service.getRandomIdsExcludingTop5(key);
        if (!randomWinners.length) {
            sendMessage(chatId, "Foydalanuvchilar topilmadi.");
        } else {
            const message = randomWinners.map((user, index) => {
                const link = `[${user}](tg://user?id=${user})`;
                winners[key][user] = { user_id: user };
                return `${index + 1}. ID: ${link}`;
            });
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "❌", callback_data: "konkurs|cancel_Random" },
                            { text: "✅", callback_data: "konkurs|accept_Random" },
                        ],
                    ],
                },
                parse_mode: "Markdown",
            };
            sendMessage(
                chatId,
                [
                    "*Random tanlov natijasi*👇\n",
                    ...message,
                    "\n*Buni tasdiqlaysizmi ?*",
                ].join("\n"),
                options
            );
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Random foydalanuvchilar aniqlandi!",
                show_alert: false,
            });
        }
    }
    const create_lobby = async (callbackQuery) => {
        let lobby = {}
        const chatId = callbackQuery.from.id;
        if (security[key]?.owners_chat_id.includes(chatId)) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Lobby yaratish boshlatildi!",
                show_alert: false,
            });
            bot
                .sendMessage(chatId, "Lobby matini shu habarga javoban yozing:", {
                    reply_markup: { force_reply: true },
                })
                .then((sentMessage) => {
                    bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                        lobby.text = reply.text;
                        await bot.sendMessage(chatId, "Konkurs matni saqlandi ✅");
                        bot
                            .sendMessage(chatId, "Tugma uchun matnni shu habarga javoban yozing:", {
                                reply_markup: { force_reply: true },
                            })
                            .then((sentMessage) => {
                                bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                                    lobby.button_text = reply.text;
                                    await bot.sendMessage(chatId, "Tugma matni saqlandi ✅");
                                    bot
                                        .sendMessage(chatId, "Lobbyga ro'yxatga olish necha *SOAT(* `1` *)* yoki *MINUT(* `0.30` *)* davom etishi kerakligini shu habarga javoban yozing:", {
                                            parse_mode: "Markdown",
                                            reply_markup: { force_reply: true },
                                        })
                                        .then((sentMessage) => {
                                            bot.onReplyToMessage(chatId, sentMessage.message_id, async (reply) => {
                                                const time = reply.text.replace(/\D/g, '').replace(/^0+/, '') || '0';
                                                const type = reply.text.startsWith("0") ? "minute" : "hour";
                                                const end_time = dayjs().add(time, type).format("YYYY-MM-DD HH:mm:ss");
                                                lobby.end_time = dayjs(end_time, "YYYY-MM-DD HH:mm:ss").valueOf()
                                                await bot.sendMessage(chatId, "Ro'yxatga olish davomiyligi saqlandi ✅");
                                                const lobby_options = {
                                                    reply_markup: {
                                                        inline_keyboard: [
                                                            [{
                                                                text: lobby.button_text,
                                                                url: `https://t.me/satoshkin_meetup_bot?start=track_user`,
                                                            }],
                                                        ],
                                                    },
                                                    parse_mode: "Markdown",
                                                };
                                                const options = {
                                                    reply_markup: {
                                                        inline_keyboard: [
                                                            [
                                                                {
                                                                    text: "Shablonni kanalga jo'nat",
                                                                    callback_data: `send_lobby|${lobby.text},${lobby.button_text},${lobby.end_time}`,
                                                                },
                                                                {
                                                                    text: "Bekor qilish",
                                                                    callback_data: `reject_lobby|`,
                                                                },
                                                            ],
                                                        ],
                                                    },
                                                    parse_mode: "Markdown",
                                                };
                                                await sendMessage(chatId, lobby.text, lobby_options);
                                                sendMessage(chatId, `Iltimos lobby malumotlarini tekshirib chiqing:\n\nRo'yxatga olish davomiyligi:\n*${end_time}* gacha`, options)
                                            });
                                        });
                                });
                            });
                    });
                });

        } else {
            bot.sendMessage(chatId, "Bu buyruqni berish uchun sizda vakolat yo'q");
        }
    }
    const send_lobby = async (callbackQuery, dinamic) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;
        const [text, button_text, end_time] = dinamic.split(",");
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            }
        );
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Lobby yaratildi!",
            show_alert: false,
        });
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: button_text,
                        url: `https://t.me/${security[key].bot_username?.split("@")[1]}?start=joinlobby_${end_time}`,
                    }]
                ],
            },
            parse_mode: "Markdown",
        };
        await sendMessage(security[key]?.deleted_orders_chat_id, text, options);
        sendMessage(chatId, `Lobby kanalga yuborildi ✅`,)
    }
    const reject_lobby = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const message_id = callbackQuery.message.message_id;

        await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Lobby bekor qilindi!",
            show_alert: true,
        });
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: chatId,
                message_id: message_id,
            }
        );
        sendMessage(chatId, "Lobby bekor qilindi!", {
            reply_to_message_id: message_id,
        });
    }
    const my_konkurs = async (callbackQuery) => {
        const chatId = callbackQuery.from.id;
        const my_konkurs = await u_controller.getMyKonkurs(key);
        if (!my_konkurs.length) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Sizda hali hech qanday konkurs mavjud emas!",
                show_alert: true,
            });
            return;
        }
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Konkurslar ro'yxati tayyorlandi!",
            show_alert: false,
        });

        my_konkurs.forEach((konkurs) => {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: konkurs.status === 1 ? `✅ ON` : `❌ OFF`, callback_data: `update_konkurs|${konkurs.name}_${konkurs.status === 1 ? 2 : 1}` }],
                        [{ text: "🗑 O'shirish", callback_data: `delete_konkurs|${konkurs.name}` }],
                    ],
                },
                parse_mode: "Markdown",
            };
            setTimeout(() => {
                sendMessage(chatId, `*${konkurs.name}*`, options);
            }, 1000);
        });
    }
    const update_konkurs = async (callbackQuery, dinamic) => {
        const chatId = callbackQuery.from.id;
        const msg_id = callbackQuery.message.message_id;
        const [name, status] = dinamic.split("_");
        const s = await u_controller.updateKonkursStatus(name, status, key);
        if (!s) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Konkursni yangilashda xatolik yuz berdi ❌",
                show_alert: true,
            });
        }
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Konkurs muvoffaqiyatli yangilandi!",
            show_alert: false,
        });

        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [
                    [{ text: status === "1" ? `✅ ON` : `❌ OFF`, callback_data: `update_konkurs|${name}_${status === "1" ? 2 : 1}` }],
                    [{ text: "🗑 O'shirish", callback_data: `delete_konkurs|${name}` }],
                ],
            },
            {
                chat_id: chatId,
                message_id: msg_id,
            }
        );

    }
    const delete_konkurs = async (callbackQuery, name) => {
        const chatId = callbackQuery.from.id;
        const msg_id = callbackQuery.message.message_id;
        const s = await u_controller.deleteKonkurs(name, key);
        if (!s) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Konkursni o'chirishda xatolik yuz berdi ❌",
                show_alert: true,
            });
        }
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Konkurs o'chirildi!",
            show_alert: true,
        });
        bot.deleteMessage(chatId, msg_id);
    }

    return {
        create_konkurs,
        accept_konkurs,
        accept_send_konkurs,
        reject_konkurs,
        join_to_konkurs,
        top5,
        random,
        by_user_count,
        by_deadline,
        create_lobby,
        send_lobby,
        reject_lobby,
        my_konkurs,
        update_konkurs,
        delete_konkurs,
    };
};

module.exports = { setupExtras };