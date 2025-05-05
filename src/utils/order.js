const { setupSendMessages } = require("./response");
const service = require("../service/register.service");
const {
    generateId,
    convertToTimeFormat,
    calculateEndDateTime,
    calcTimeRange,
} = require("../utils/services");
const security = require("../../mocks/security");
const o_controller = require("../controller/order.controller");
const u_controller = require("../controller/user.controller");

const setupOrders = (bot, key) => {
    if (!bot) {
        throw new Error("Bot or service is not provided correctly.");
    }
    const {
        sendMessageForSuccess,
        sendMessage,
        sendVideoNote,
        sendLocation,
        deleteMessage,
        sendMessageForSuccessUpdate,
    } = setupSendMessages(bot, key);

    const delete_order_cancel = async (callbackQuery, dinamic) => {
        const ids = dinamic?.split("_");
        const s = await o_controller.askDeleteOrder(4, ids[0], key);
        if (s) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Buyurtma o'chirish so'rovi bekor qilindi! Bekor qilish sababini ushbu habarga javoban yozishingiz mumkun!",
                show_alert: true,
            });
            bot.sendMessage(
                ids[1],
                `${ids[0]} ID dagi buyurtmani bekor qilish haqidagi so'rov admin tomonidan tasdiqlanmadi!`,
                { parse_mode: "Markdown" }
            );
            bot.editMessageReplyMarkup(
                {
                    inline_keyboard: [
                        [{ text: "Tasdiqlanmadi❌", callback_data: `done|` }],
                    ],
                },
                {
                    chat_id: security[key]?.ask_cancel_chat,
                    message_id: ids[2],
                }
            );
        }
    };
    const delete_order_accept = async (callbackQuery, dinamic) => {
        const ids = dinamic?.split("_");
        const s = await o_controller.askDeleteOrder(5, ids[0], key);
        if (s) {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Buyurtma o'chirish so'rovi qabul qilindi!",
                show_alert: false,
            });
            bot.sendMessage(
                ids[1],
                `*${ids[0]}* ID dagi buyurtmani bekor qilish haqidagi so'rov admin tomonidan tasdiqlandi!\nMalumot uchun admin bilan bog'lanishingiz mumkin!`,
                { parse_mode: "Markdown" }
            );
            bot.editMessageReplyMarkup(
                {
                    inline_keyboard: [
                        [{ text: "Tasdiqlandi✅", callback_data: `done|` }],
                    ],
                },
                {
                    chat_id: security[key]?.ask_cancel_chat,
                    message_id: ids[2],
                }
            );
        }
    };
    const new_order_accept = async (callbackQuery, dinamic) => {
        const ids = dinamic?.split("_");
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: security[key]?.new_orders_chat_id,
                message_id: ids[1],
            }
        );
        sendMessage(security[key]?.new_orders_chat_id, "*Buyurtma qabul qilindi! ✅*", {
            reply_to_message_id: ids[1],
            parse_mode: "Markdown",
        });

        sendMessage(
            ids[0],
            "*Buyurtmangiz Tasdiqlandi✅*\n\n*@ATOMIC_CARDS — Shu yerdagi kartalardan biriga to'lov qilib chekni yuboring!*",
            { parse_mode: "Markdown" }
        );
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "buyurtma olindi!",
            show_alert: false,
        });
    };
    const new_order_reject = async (callbackQuery, dinamic) => {
        const ids = dinamic?.split("_");
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [],
            },
            {
                chat_id: security[key]?.new_orders_chat_id,
                message_id: ids[1],
            }
        );
        sendMessage(
            security[key]?.new_orders_chat_id,
            `${ids[0]}-ning buyurtmasi bekor qilindi!\nBekor qilish sababi mavjud bo'lsa shu habarga javoban ovozli habar yuboring yoki yozing!`,
            {
                reply_to_message_id: ids[1],
                parse_mode: "Markdown",
            }
        );

        sendMessage(
            ids[0],
            "*Admin buyurtmangizni rad etdi!*\n*Qayta urinib ko'ring!*",
            { parse_mode: "Markdown" }
        );
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "buyurtma rad etildi!",
            show_alert: false,
        });
    };
    const payment_order_accept = async (callbackQuery, dinamic, form) => {
        const userId = callbackQuery.from.id;
        const user_id = dinamic;
        const message_id = callbackQuery.message.message_id;
        if (security[key]?.owners_chat_id.includes(userId)) {
            const user = form[user_id];

            if (!user) {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Foydalanuvchi topilmadi!",
                    show_alert: true,
                });
                return;
            }
            const convertTime = (time) => {
                if (time.endsWith(")")) {
                    return 12;
                } else {
                    const t = time?.split(" ");
                    if (t[1] === "soat" || t[1] === "s") return parseFloat(t[0]);
                    if (t[1] === "kun") return parseFloat(t[0]) * 24;
                }
            };
            const shablon_id = generateId();
            const { action_hour, start_hour } = calcTimeRange(user.start_hour);
            const time = user.bonus ? convertTime(user.time) + parseFloat(user.bonus) : convertTime(user.time);
            const value = {
                user_id: user_id,
                acc_id: user.acc_id,
                time: time,
                paid: user?.price,
                id: shablon_id,
                start_time: `${user.start_date?.split(" -")[0]} - ${start_hour}`,
                imgs: user.photo,
                mobile_info: user.mobile_info || 'can not get mobile info',
                location: user.location || [null, null],
            };
            const s = await service.handleUserResponse(value, action_hour, false, key);
            if (s) {
                const formattedValue = user?.price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                const link = `[${user_id}](tg://user?id=${user_id})`;
                const adminMessage = `User id: ${link}\nOrder id: ${shablon_id}\nAcc nomi: ${user.short_name
                    }\nDavomiyligi: ${user.time} ${user.bonus ? ` + ${user.bonus}` : ""}\nBoshlanish vaqti: ${user.start_date?.split(" -")[0]} - ${start_hour} \n\nOlingan to'lov miqdori: ${formattedValue} so'm`;
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Buyurtma yakunlandi 😊",
                    show_alert: true,
                });

                sendMessage(security[key]?.paid_chat_id, `*№${user?.id} Buyurtma qabul qilindi! ✅* `, {
                    reply_to_message_id: message_id,
                    parse_mode: "Markdown",
                });
                bot.editMessageReplyMarkup(
                    { inline_keyboard: [[]] },
                    { chat_id: security[key]?.paid_chat_id, message_id: message_id }
                );

                sendMessage(
                    user_id,
                    `* Buyurtma id №*\`${shablon_id}\`\n\n*Tabriklaymiz, Siz endi @ARENDA_BRO ga kirish vaqtingiz* *bo'lganda yozib ${user?.id} ni olishingiz mumkin✅*\n\n*START: ${user.start_date?.split(" -")[0]} - ${start_hour}*\n*VAQT: ${user?.time} ${user?.bonus ? ` + ${user?.bonus}` : ""}*`,
                    { parse_mode: "Markdown" }
                );
                const spins = await u_controller.getUsersSpins(user_id, key);
                await u_controller.updateUserSpins(user_id, spins + 2, key);
                const mediaGroup = user?.photo?.map((photoId) => ({
                    type: "photo",
                    media: photoId,
                }));
                bot
                    .sendMediaGroup(security[key]?.closed_orders_chat_id, mediaGroup)
                    .then((s) => {
                        const msg_id = s.message_id;
                        if (user.location[0] && user.location[1]) {
                            bot.sendLocation(security[key]?.closed_orders_chat_id, user.location[0], user.location[1], {
                                reply_to_message_id: msg_id,
                            });
                        }
                        bot.sendMessage(security[key]?.closed_orders_chat_id, adminMessage, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "O'chirish",
                                            callback_data: `order_delete|${shablon_id}`,
                                        },
                                        {
                                            text: "Taxrirlash",
                                            callback_data: `edit_options|${shablon_id}`,
                                        },
                                    ],
                                ],
                            },
                            parse_mode: "Markdown",
                        })

                        form[user_id] = {};
                    })
                    .catch((error) => {
                        console.error("payment_order_accept mesaj edit etme hatasi:");
                    });
            }
        } else {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Sizda bu uchun ruxsat yo'q!",
                show_alert: true,
            });
        }
    };
    const payment_order_reject = async (callbackQuery, dinamic, form) => {
        const userId = callbackQuery.from.id;
        const ids = dinamic?.split("_");
        if (security[key]?.owners_chat_id.includes(userId)) {
            const user = form[ids[0]];
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Buyurtma rad etildi!",
                show_alert: false,
            });
            sendMessage(
                security[key]?.paid_chat_id,
                `${ids[0]}-ning №${user?.id} raqamli buyurtmasi bekor qilindi!\nBekor qilish sababi mavjud bo'lsa pastdagi habarga javoban ovozli habar yuboring yoki yozing!`,
                {
                    parse_mode: "Markdown",
                }
            );
        } else {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Sizda bu uchun ruxsat yo'q!",
                show_alert: true,
            });
        }
    };
    const order_delete = async (callbackQuery, dinamic) => {
        const main_msg_id = callbackQuery.message.message_id;
        let s = await o_controller.askDeleteOrder(5, dinamic, key);
        if (s) {
            s = s[0];
            const formattedValue = s?.paid
                ?.toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            const link = `[${s.user_id}](tg://user?id=${s.user_id})`;
            const adminMessage = `User id: ${link}\nOrder id: ${s.shablon_id
                }\nAcc nomi: ${s.acc_id}\nDavomiyligi: ${s.time} ${s?.bonus ? ` + ${s?.bonus}` : ""}\nBoshlanish vaqti: ${s.start_date?.slice(5, 10)} - ${s.start_hour
                }\n\nOlingan to'lov miqdori: ${formattedValue} so'm`;
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Buyurtma o'chirilganlar ro'yxatiga qo'shildi!",
                show_alert: true,
            });
            deleteMessage(security[key]?.closed_orders_chat_id, parseInt(main_msg_id) - 1);
            deleteMessage(security[key]?.closed_orders_chat_id, main_msg_id);

            const mediaGroup = JSON?.parse(s?.imgs)?.map((photoId) => ({
                type: "photo",
                media: photoId,
            }));
            bot
                .sendMediaGroup(security[key]?.deleted_orders_chat_id, mediaGroup)
                .then(() => {
                    bot
                        .sendMessage(security[key]?.deleted_orders_chat_id, adminMessage, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "Orqaga qaytarish",
                                            callback_data: `back|${dinamic}`,
                                        },
                                    ],
                                ],
                            },
                            parse_mode: "Markdown",
                        })
                        .then((sentMessage) => {
                            const msg_id = sentMessage.message_id;
                            bot.editMessageReplyMarkup(
                                {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: "Orqaga qaytarish",
                                                callback_data: `back|${dinamic}_${msg_id}`,
                                            },
                                        ],
                                    ],
                                },
                                {
                                    chat_id: security[key]?.deleted_orders_chat_id,
                                    message_id: msg_id,
                                }
                            );
                        });
                })
                .catch((error) => {
                    console.error("payment_order_accept mesaj edit etme hatasi:");
                });
        }
    };
    const edit_options = async (callbackQuery, dinamic) => {
        const main_msg_id = callbackQuery.message.message_id;
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Buyurtma taxrirlash modiga o'tkazildi!",
            show_alert: false,
        });
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [
                    [
                        {
                            text: "Account",
                            callback_data: `short_name|${dinamic}_${main_msg_id}`,
                        },
                    ],
                    [
                        {
                            text: "Boshlanish vaqti",
                            callback_data: `start_time|${dinamic}_${main_msg_id}`,
                        },
                    ],
                    [
                        {
                            text: "Davomiyligi",
                            callback_data: `time_length|${dinamic}_${main_msg_id}`,
                        },
                    ],
                    [
                        {
                            text: "To'lov miqdori",
                            callback_data: `payment_amount|${dinamic}_${main_msg_id}`,
                        },
                    ],
                    [{ text: "Orqaga", callback_data: `back_word|${dinamic}_${main_msg_id}` }],
                ],
            },
            {
                chat_id: security[key]?.closed_orders_chat_id,
                message_id: main_msg_id,
            }
        );
    };
    const short_name = async (callbackQuery, dinamic) => {
        const [user_id, message_id] = dinamic?.split("_");
        bot
            .sendMessage(
                security[key]?.closed_orders_chat_id,
                `account short_name ni shu habarga javoban yozing:`, {
                reply_markup: {
                    force_reply: true,
                    input_field_placeholder: "Bu yerga yozing"
                }
            }
            )
            .then((sendMessage) => {
                const messageId = sendMessage.message_id;
                return bot.once("message", async (msg) => {
                    if (msg.text) {
                        try {
                            let user = await o_controller.updateFullOrder(
                                { acc_id: msg.text },
                                user_id, key
                            );
                            if (user) {
                                const formattedValue = user.paid
                                    ?.toString()
                                    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                                const link = `[${user.user_id}](tg://user?id=${user.user_id})`;
                                const adminMessage = `User id: ${link}\nOrder id: ${user.shablon_id
                                    }\nAcc nomi: ${user.acc_id}\nDavomiyligi: ${user.time} ${user.bonus ? ` + ${user.bonus}` : ""}\nBoshlanish vaqti: ${user.start_date?.slice(5, 10)} - ${user.start_hour
                                    }\n\nOlingan to'lov miqdori: ${formattedValue} so'm`;

                                await bot.editMessageText(adminMessage, {
                                    chat_id: security[key]?.closed_orders_chat_id,
                                    message_id: message_id,
                                    parse_mode: "Markdown",
                                });

                                await bot.editMessageReplyMarkup(
                                    {
                                        inline_keyboard: [
                                            [
                                                {
                                                    text: "O'chirish",
                                                    callback_data: `order_delete|${user_id}`,
                                                },
                                                {
                                                    text: "Taxrirlash",
                                                    callback_data: `edit_options|${user_id}`,
                                                },
                                            ],
                                        ],
                                    },
                                    {
                                        chat_id: security[key]?.closed_orders_chat_id,
                                        message_id: message_id,
                                    }
                                );

                                await bot.deleteMessage(security[key]?.closed_orders_chat_id, messageId);
                                await bot.deleteMessage(security[key]?.closed_orders_chat_id, msg.message_id);
                                const s = await o_controller.createOrUpdateEvent("all", user, user_id, key);
                                return await bot
                                    .answerCallbackQuery(callbackQuery.id, {
                                        text: s ? "account o'zgartildi!" : "account o'zgartirishda xatolik yuz berdi!",
                                        show_alert: true,
                                    })
                                    .catch((error) => console.log("buyurtma akk name xatosi"));
                            }
                        } catch (error) {
                            console.error("Error handling message:", error);
                        }
                    }
                });
            })
            .catch((error) => {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Xatolik yuz berdi 1 daqiqadan so'ng takror urinib ko'ring!",
                    show_alert: false,
                });
            });
    };
    const start_time = async (callbackQuery, dinamic) => {
        const [user_id, message_id] = dinamic?.split("_");
        bot
            .sendMessage(
                security[key]?.closed_orders_chat_id,
                `Buyurtma boshlanish soatini shu habarga javoban yozing:`, {
                reply_markup: {
                    force_reply: true,
                    input_field_placeholder: "Bu yerga yozing"
                }
            }
            )
            .then((sendMessage) => {
                const messageId = sendMessage.message_id;
                return bot.once("message", async (msg) => {
                    if (msg.text) {
                        const [date, hour] = msg.text.split(" ");
                        let user = await o_controller.updateOrder(
                            {
                                start_date: `${new Date().getFullYear()}.${date} ${hour}`,
                                start_hour: hour,
                            },
                            user_id, key
                        );
                        if (user) {
                            user = user[0];
                            const formattedValue = user.paid
                                ?.toString()
                                .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                            const link = `[${user.user_id}](tg://user?id=${user.user_id})`;
                            const adminMessage = `User id: ${link}\nOrder id: ${user.shablon_id
                                }\nAcc nomi: ${user.acc_id}\nDavomiyligi: ${user.time} ${user.bonus ? ` + ${user.bonus}` : ""}\nBoshlanish vaqti: ${user.start_date?.slice(5, 10)} - ${user.start_hour
                                }\n\nOlingan to'lov miqdori: ${formattedValue} so'm`;
                            await bot.editMessageText(adminMessage, {
                                chat_id: security[key]?.closed_orders_chat_id,
                                message_id: message_id,
                                parse_mode: "Markdown",
                            });
                            await bot.editMessageReplyMarkup(
                                {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: "O'chirish",
                                                callback_data: `order_delete|${user_id}`,
                                            },
                                            {
                                                text: "Taxrirlash",
                                                callback_data: `edit_options|${user_id}`,
                                            },
                                        ],
                                    ],
                                },
                                {
                                    chat_id: security[key]?.closed_orders_chat_id,
                                    message_id: message_id,
                                }
                            );
                            await deleteMessage(security[key]?.closed_orders_chat_id, messageId);
                            await deleteMessage(security[key]?.closed_orders_chat_id, msg.message_id);
                            await o_controller.createOrUpdateEvent("start", user, user_id, key);
                            return await bot
                                .answerCallbackQuery(callbackQuery.id, {
                                    text: "Boshlanish vaqti o'zgartildi!",
                                    show_alert: false,
                                })
                                .catch((error) => console.log("buyurtma boshlanish xatosi"));
                        }
                    }
                });
            })
            .catch((error) => {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Xatolik yuz berdi 1 daqiqadan so'ng takror urinib ko'ring!",
                    show_alert: false,
                });
            });
    };
    const time_length = async (callbackQuery, dinamic) => {
        const [user_id, message_id] = dinamic?.split("_");
        bot
            .sendMessage(
                security[key]?.closed_orders_chat_id,
                `Buyrtmaning davomiyligini soat formatida raqamlar bilan shu habarga javoban yozing:`, {
                reply_markup: {
                    force_reply: true,
                    input_field_placeholder: "Bu yerga yozing"
                }
            }
            )
            .then((sendMessage) => {
                const messageId = sendMessage.message_id;
                return bot.once("message", async (msg) => {
                    if (msg.text) {
                        let user = await o_controller.updateOrder(
                            { time: msg.text },
                            user_id, key
                        );
                        if (user) {
                            user = user[0];
                            const formattedValue = user.paid
                                ?.toString()
                                .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                            const link = `[${user.user_id}](tg://user?id=${user.user_id})`;
                            const adminMessage = `User id: ${link}\nOrder id: ${user.shablon_id
                                }\nAcc nomi: ${user.acc_id}\nDavomiyligi: ${user.time} ${user.bonus ? ` + ${user.bonus}` : ""}\nBoshlanish vaqti: ${user.start_date?.slice(5, 10)} - ${user.start_hour
                                }\n\nOlingan to'lov miqdori: ${formattedValue} so'm`;
                            await bot.editMessageText(adminMessage, {
                                chat_id: security[key]?.closed_orders_chat_id,
                                message_id: message_id,
                                parse_mode: "Markdown",
                            });
                            await bot.editMessageReplyMarkup(
                                {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: "O'chirish",
                                                callback_data: `order_delete|${user_id}`,
                                            },
                                            {
                                                text: "Taxrirlash",
                                                callback_data: `edit_options|${user_id}`,
                                            },
                                        ],
                                    ],
                                },
                                {
                                    chat_id: security[key]?.closed_orders_chat_id,
                                    message_id: message_id,
                                }
                            );
                            await deleteMessage(security[key]?.closed_orders_chat_id, messageId);
                            await deleteMessage(security[key]?.closed_orders_chat_id, msg.message_id);
                            const value = calculateEndDateTime(user);
                            await o_controller.updateOrder(
                                {
                                    end_date: `${value.end_date} ${value.end_hour}`,
                                    end_hour: value.end_hour,
                                },
                                user_id, key
                            );
                            await o_controller.createOrUpdateEvent("end", value, user_id, key);
                            return await bot
                                .answerCallbackQuery(callbackQuery.id, {
                                    text: "buyurtma davomiyligi o'zgartildi!",
                                    show_alert: false,
                                })
                                .catch((error) => console.log("buyurtma davomiyligi xatosi"));
                        }
                    }
                });
            })
            .catch((error) => {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Xatolik yuz berdi 1 daqiqadan so'ng takror urinib ko'ring!",
                    show_alert: false,
                });
            });
    };
    const payment_amount = async (callbackQuery, dinamic) => {
        const [user_id, message_id] = dinamic?.split("_");
        bot
            .sendMessage(
                security[key]?.closed_orders_chat_id,
                `Buyurtmanin to'lov miqdorini (000000) kabi shu habarga javoban yozing:`, {
                reply_markup: {
                    force_reply: true,
                    input_field_placeholder: "Bu yerga yozing"
                }
            }
            )
            .then((sendMessage) => {
                const messageId = sendMessage.message_id;
                return bot.once("message", async (msg) => {
                    if (msg.text) {
                        let user = await o_controller.updateOrder(
                            { paid: msg.text },
                            user_id, key
                        );
                        if (user) {
                            user = user[0];
                            const formattedValue = user.paid
                                ?.toString()
                                .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                            const link = `[${user.user_id}](tg://user?id=${user.user_id})`;
                            const adminMessage = `User id: ${link}\nOrder id: ${user.shablon_id
                                }\nAcc nomi: ${user.acc_id}\nDavomiyligi: ${user.time} ${user.bonus ? ` + ${user.bonus}` : ""}\nBoshlanish vaqti: ${user.start_date.slice(5, 10)} - ${user.start_hour
                                }\n\nOlingan to'lov miqdori: ${formattedValue} so'm`;
                            await bot.editMessageText(adminMessage, {
                                chat_id: security[key]?.closed_orders_chat_id,
                                message_id: message_id,
                                parse_mode: "Markdown",
                            });
                            await bot.editMessageReplyMarkup(
                                {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: "O'chirish",
                                                callback_data: `order_delete|${user_id}`,
                                            },
                                            {
                                                text: "Taxrirlash",
                                                callback_data: `edit_options|${user_id}`,
                                            },
                                        ],
                                    ],
                                },
                                {
                                    chat_id: security[key]?.closed_orders_chat_id,
                                    message_id: message_id,
                                }
                            );
                            await deleteMessage(security[key]?.closed_orders_chat_id, messageId);
                            await deleteMessage(security[key]?.closed_orders_chat_id, msg.message_id);
                            return await bot
                                .answerCallbackQuery(callbackQuery.id, {
                                    text: "buyurtma to'lov miqdori o'zgartildi!",
                                    show_alert: false,
                                })
                                .catch((error) => console.log("buyurtma to'lovi xatosi"));
                        }
                    }
                });
            })
            .catch((error) => {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Xatolik yuz berdi 1 daqiqadan so'ng takror urinib ko'ring!",
                    show_alert: false,
                });
            });
    };
    const back_word = async (callbackQuery, dinamic) => {
        const [user_id, message_id] = dinamic?.split("_");
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Buyurtma taxrirlash mode dan chiqildi!",
            show_alert: false,
        });
        bot.editMessageReplyMarkup(
            {
                inline_keyboard: [
                    [
                        {
                            text: "O'chirish",
                            callback_data: `order_delete|${user_id}`,
                        },
                        {
                            text: "Taxrirlash",
                            callback_data: `edit_options|${user_id}`,
                        },
                    ],
                ],
            },
            {
                chat_id: security[key]?.closed_orders_chat_id,
                message_id: message_id,
            }
        );
    };
    const form_accept = async (callbackQuery, dinamic, templateDatas) => {
        const userId = callbackQuery.from.id;
        const us_id = dinamic;

        if (!security[key]?.owners_chat_id.includes(userId)) {
            const user = templateDatas[us_id];

            if (!user) {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Shablon allaqachon ishlatilgan yoki yaroqsiz!",
                    show_alert: true,
                });
                return;
            }

            const value = {
                user_id: userId,
                acc_id: user.acc_number,
                time: user.time,
                paid: user.price,
                id: us_id,
                start_time: `${user.month}.${user.day} - ${user.start_hour}`,
                imgs: user.imgs,
                mobile_info: user.mobile_info || 'with shablon',
                location: user.location || [null, null],
            };

            const s = await service.handleUserResponse(value, user.action_hour, true, key);
            const formattedValue = user?.price?.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            const link = `[${userId}](tg://user?id=${userId})`;
            const adminMessage = `User id: ${link}\nOrder id: ${us_id}\nAcc nomi: ${user.acc_number
                }\nDavomiyligi: ${convertToTimeFormat(
                    user.time
                )}\nBoshlanish vaqti: ${user.month}.${user.day} - ${user.start_hour}\n\nOlingan to'lov miqdori: ${formattedValue} so'm`;

            if (s) {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Haridingiz uchun rahmat 😊",
                    show_alert: true,
                });
                const mediaGroup = user?.imgs?.map((photoId) => ({
                    type: "photo",
                    media: photoId,
                }));
                templateDatas[us_id] = {};
                delete templateDatas[us_id];
                bot
                    .sendMediaGroup(security[key]?.closed_orders_chat_id, mediaGroup)
                    .then(() => {
                        bot
                            .sendMessage(security[key]?.closed_orders_chat_id, adminMessage, {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: "O'chirish",
                                                callback_data: `order_delete|${us_id}`,
                                            },
                                            {
                                                text: "Taxrirlash",
                                                callback_data: `edit_options|${us_id}`,
                                            },
                                        ],
                                    ],
                                },
                                parse_mode: "Markdown",
                            })
                    })
                    .catch((error) => {
                        console.error("payment_order_accept mesaj edit etme hatasi:");
                    });
            } else {
                bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Harid shabloni allaqachon ishlatilgan!",
                    show_alert: true,
                });
            }
        } else {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Siz haridor emassiz!",
                show_alert: true,
            });
        }
    };
    const admin_accept = async (callbackQuery, dinamic, userInfo) => {
        const user_id = dinamic;
        const user = userInfo[user_id];
        const msg_id = callbackQuery.message.message_id;
        const s = await service.handleAdminResponse(user, key);
        if (s) {
            const link = `[${user?.name}](tg://user?id=${user?.userId})`;
            const adminMessage = `Yangi Registiratsiya:\n— ism: ${user?.name}\n— tel: ${user?.phone}\n— user name: ${link}\n— user ID: ${user?.userId}`;
            await sendLocation(
                security[key]?.registered_users_chat_id,
                user?.location.latitude,
                user?.location.longitude
            );
            await sendVideoNote(security[key]?.registered_users_chat_id, user?.video_note);
            const mediaGroup = user?.photo?.map((photoId) => ({
                type: "photo",
                media: photoId,
            }));

            bot.sendMediaGroup(security[key]?.registered_users_chat_id, mediaGroup).then((sentMessage) => {
                const msg_id = sentMessage.message_id;
                const done_option = {
                    parse_mode: "Markdown",
                    reply_to_message_id: msg_id,
                }
                bot.sendMessage(security[key]?.registered_users_chat_id, adminMessage, done_option);
            });

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
            sendMessage(
                user?.userId,
                "Tabriklaymiz! Sizning ma'lumotlaringiz qabul qilindi.",
                options
            );
            sendMessageForSuccessUpdate(msg_id)
            sendMessageForSuccess(`Yangi ${link} foydalanuvchi qo'shildi.`);
        } else {
            sendMessage(user_id, "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        }
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "foydalanuvchi qabul qilindi!",
            show_alert: false,
        });
    };
    const admin_reject = async (callbackQuery, dinamic) => {
        const chatId = callbackQuery.from.id;
        bot
            .sendMessage(
                chatId,
                `${dinamic}-nin malumotlarini rad etish sababini shu xabaga javoban yozing.`
            )
            .then((sentMessage) => {
                bot.onReplyToMessage(dinamic, sentMessage.message_id, (reply) => {
                    sendMessage(
                        JSON.parse(dinamic),
                        `*Kechirasiz, Sizning ma'lumotlaringiz qabul qilinmadi. Qayta urinib ko'ring* /start.`,
                        { parse_mode: "Markdown" }
                    );
                    sendMessage(JSON.parse(dinamic), `Admin javobi:\n${reply.text}`);
                });
            })
            .catch((error) => {
                console.log("admin_reject error");
            });

        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Habar foydalanuvchiga yetkazildi!",
            show_alert: false,
        });
    };
    const back = async (callbackQuery, dinamic) => {
        const ids = dinamic?.split("_");
        let s = await o_controller.askDeleteOrder(5, ids[0], key);
        if (s) {
            s = s[0];
            const formattedValue = s?.paid
                ?.toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            const link = `[${s.user_id}](tg://user?id=${s.user_id})`;
            const adminMessage = `User id: ${link}\nOrder id: ${s.shablon_id
                }\nAcc nomi: ${s.acc_id}\nDavomiyligi: ${s.time} ${s?.bonus ? ` + ${s?.bonus}` : ""}\nBoshlanish vaqti: ${s.start_date?.slice(5, 10)} - ${s.start_hour
                }\n\nOlingan to'lov miqdori: ${formattedValue} so'm`;

            await deleteMessage(security[key]?.deleted_orders_chat_id, parseInt(ids[1]) - 1);
            await deleteMessage(security[key]?.deleted_orders_chat_id, ids[1]);

            const mediaGroup = JSON?.parse(s?.imgs)?.map((photoId) => ({
                type: "photo",
                media: photoId,
            }));
            await bot
                .sendMediaGroup(security[key]?.closed_orders_chat_id, mediaGroup)
                .then(() => {
                    bot
                        .sendMessage(security[key]?.closed_orders_chat_id, adminMessage, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "O'chirish",
                                            callback_data: `order_delete|${ids[0]}`,
                                        },
                                        {
                                            text: "Taxrirlash",
                                            callback_data: `edit_options|${ids[0]}`,
                                        },
                                    ],
                                ],
                            },
                            parse_mode: "Markdown",
                        })
                })
                .catch((error) => {
                    console.error("payment_order_accept mesaj edit etme hatasi:");
                });
            await o_controller.createOrUpdateEvent("all", s, ids[0], key);
            return await bot.answerCallbackQuery(callbackQuery.id, {
                text: "Buyurtma o'chirilganlar ro'yxatidan olib tashlandi!",
                show_alert: true,
            });
        }
    };

    return {
        delete_order_cancel,
        delete_order_accept,
        new_order_accept,
        new_order_reject,
        payment_order_accept,
        payment_order_reject,
        order_delete,
        edit_options,
        short_name,
        start_time,
        time_length,
        payment_amount,
        back_word,
        form_accept,
        admin_accept,
        admin_reject,
        back,
    };
};

module.exports = { setupOrders };