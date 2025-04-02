const security = require("../../mocks/security");
const { convertToTimeFormat, generateId, calcTimeRange } = require("../utils/services");

const photoHandler = (bot, key) => {
    const timers = {};

    const adminSetup = (
        chatId,
        form,
        mode,
        callballResult,
        templateDatas,
        img,
        acc_data
    ) => {
        if (mode[chatId] === "dev") {
            form[chatId] = {
                ...form[chatId],
                imgs: [...(form[chatId]?.imgs || []), img],
            };
            const us = form?.[chatId] || {};
            const createMessage = (id) => {
                const date = new Date();
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const day = date.getDate().toString().padStart(2, "0");
                const { action_hour, start_hour } = calcTimeRange(`${date.getHours()}:${date.getMinutes()}`, true);
                form[chatId] = {
                    ...form[chatId],
                    month,
                    day,
                    start_hour,
                    action_hour,
                };
                const options = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "❌", callback_data: `cancel_shablon|${id}`, },
                                {
                                    text: "✅", callback_data: `accept_start_time|${id}_${us?.acc_number || us?.acc_name}`,
                                }
                            ],
                        ],
                    },
                    parse_mode: "Markdown",
                };
                bot.sendMessage(
                    chatId,
                    `Buyurtma boshlanishi vaqti: ${month}.${day} - ${start_hour}\nBand qilinish vaqti: ${month}.${day} - ${action_hour}\n\n Buni tasdiqlaysizmi?`,
                    options
                );
                templateDatas[id] = form[chatId];
                form[chatId] = {};
                const formattedValue = us?.price?.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                const forma = `Sizning buyurtmangiz:\n\nID — ${id}\nACC — ${us?.acc_number || us?.acc_name
                    }\nVAQT — ${convertToTimeFormat(
                        us?.time
                    )} ga\nNARX — ${formattedValue} so'm\n\nAKKAUNT JAVOBGARLIGINI OLASIZMI?`;

                callballResult.push({
                    type: "article",
                    id: "1",
                    title: id,
                    input_message_content: { message_text: forma },
                    description: "Buyurtma shabloni",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Ha, ROZIMAN✅",
                                    callback_data: `form_accept|${id}`,
                                },
                            ],
                        ],
                    },
                    parse_mode: "Markdown",
                });
            };

            if (timers[chatId] && timers[chatId] !== null) {
                clearTimeout(timers[chatId]);
                timers[chatId] = null;
                createMessage(generateId());
            } else {
                timers[chatId] = setTimeout(() => {
                    createMessage(generateId());
                    timers[chatId] = null;
                }, 750);
            }
        } else {
            if (acc_data.imgs?.length === 3) {
                acc_data.imgs = [...(acc_data?.imgs || []), img];
                bot.sendMessage(chatId, "Rasmlar muvoffaqiyatli qo'shildi!");
                const arrayWith30interinden = Array.from(
                    { length: 15 },
                    (_, i) => `${i + 1}`
                );
                bot.sendMessage(
                    chatId,
                    `Endi belgilangan vaqt uchun kunlik narxlar to'plamini ko'rsatilganidek \`/daily_price_list ${JSON.stringify(
                        arrayWith30interinden
                    )}\` jo'nating!`,
                    {
                        parse_mode: "Markdown",
                    }
                );
            } else {
                acc_data.imgs = [...(acc_data?.imgs || []), img];
            }
        }
    };
    const userSetup = (chatId, form, mode, userInfo, name, img) => {
        if (mode[chatId] === "user_dev") {
            let user = form[chatId] || {};
            if (timers[chatId]) {
                clearTimeout(timers[chatId]);
                timers[chatId] = null;
            }
            user = {
                ...user,
                photo: [...(user?.photo || []), img],
            };
            timers[chatId] = setTimeout(() => {
                bot.sendMessage(
                    chatId,
                    "*Endi Admin Chekni tasdiqlashini biroz kuting!*",
                    { parse_mode: "Markdown" }
                );

                const formattedPrice = user?.price
                    ?.toString()
                    ?.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                const link = `[${name}](tg://user?id=${chatId})`;
                const message = `*Yangi buyurtma №${user?.acc_id}*\n\nACC: ${user.acc_name
                    }\nNarxi: ${formattedPrice} so'm\nstart: ${user.start_date}\ndavomiyligi: ${user.time} ${user.bonus ? ` + ${user.bonus}` : ""}\n\n*Buyurtma beruvchi:* ${link} - ${chatId}`;

                const mediaGroup = user?.photo?.map((photoId) => ({
                    type: "photo",
                    media: photoId,
                }));

                bot
                    .sendMediaGroup(security[key]?.paid_chat_id, mediaGroup)
                    .then(() => {
                        bot.sendMessage(security[key]?.paid_chat_id, message, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "❌",
                                            callback_data: `payment_order_reject|${chatId}`,
                                        },
                                        {
                                            text: "✅",
                                            callback_data: `payment_order_accept|${chatId}`,
                                        },
                                    ],
                                ],
                            },
                            parse_mode: "Markdown",
                        });
                    })
                    .catch((error) => {
                        console.error("Mesaj gönderme hatası:", error.response.body);
                    });

                timers[chatId] = null;
            }, 750);

            form[chatId] = user;
        } else if (userInfo[chatId]?.order === "photo") {
            userInfo[chatId] = {
                ...userInfo[chatId],
                photo: [...(userInfo[chatId]?.photo || []), img],
                name: name,
            };
            const createMessage = () => {
                const options = {
                    reply_markup: {
                        keyboard: [
                            [{ text: "Locatsiyamni ulashish", request_location: true }],
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: true,
                    },
                    parse_mode: "Markdown",
                };
                bot.sendMessage(
                    chatId,
                    "*Iltimos shaxsiy Locatsiyangizni ulang:*",
                    options
                );;
            };

            if (timers[chatId] && timers[chatId] !== null) {
                clearTimeout(timers[chatId]);
                timers[chatId] = null;
                createMessage();
            } else {
                timers[chatId] = setTimeout(() => {
                    createMessage();
                    timers[chatId] = null;
                }, 750);
            }
        } else {
            bot.sendMessage(chatId, "Ayni vaqtda sizdan hech qanday rasm talab qilinmadi!");
        }
    };

    return {
        adminSetup,
        userSetup,
    };
};

module.exports = photoHandler;
