const u_service = require("./src/service/user.service");
const controller = require("./src/controller/user.controller");
const o_controller = require("./src/controller/order.controller");
const security = require("./mocks/security");
const service = require("./src/service/register.service");
const { form } = require("./mocks/state");

const setupRouterkHandlers = (socket, bot, dbName) => {
    if (!socket) {
        throw new Error("socket or service is not provided correctly.");
    }

    socket.on(`/all/accs`, async (ds, callback) => {
        try {
            const result = await controller.getAllAccs(dbName);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    });
    socket.on(`/get_acc/byId`, async (id, callback) => {
        try {
            const result = await controller.getAccById(id, dbName);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    });
    socket.on(`/reserve/acc`, async (ds, callback) => {
        try {
            const result = await controller.reserveAcc(ds, dbName);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    });
    socket.on(`/add_acc`, async (data, callback) => {
        try {
            const result = await controller.addAcc(data, dbName);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    });
    socket.on(`/update_acc`, async (data, callback) => {
        try {
            const result = await controller.updateAcc(data, dbName);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    });
    socket.on(`/imageUpload`, async (data, callback) => {
        try {
            const result = await u_service.getImgUrl(data);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    });
    socket.on(`/changeImgUrl`, async (data, callback) => {
        try {
            const result = await u_service.changeUrl(data.new, data.old);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    });
    socket.on(`/get-acc/sales-list/byId`, async (id, callback) => {
        try {
            const result = await controller.getAccSalesListById(id, dbName);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    });
    socket.on(`/my-favourites`, async (data, callback) => {
        try {
            const result = await controller.getFavouriteList(data, dbName);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    })
    socket.on(`/add-to-fav`, async (data, callback) => {
        try {
            const result = await controller.addAccFavouriteList(data, dbName);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    })
    socket.on(`/remove-from-fav`, async (data, callback) => {
        try {
            const result = await controller.removeAccFavouriteList(data, dbName);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    })
    socket.on(`/get-my-orders`, async (data, callback) => {
        try {
            const result = await o_controller.getMyOrders(data, dbName);
            callback(result);
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
        }
    })
    socket.on(`/web-app-data`, async (inlineData, callback) => {
        try {
            const { chatId, data, username } = JSON.parse(inlineData);
            const id = data?.short_name;
            const existUser = await service.checkIfRegistered(chatId, dbName);
            if (existUser) {
                form[dbName][chatId] = { id, ...form[chatId], ...data };
                bot.sendMessage(
                    chatId,
                    `*Endi Admin Buyurtmani Qabul Qilishini Kuting!*`,
                    {
                        parse_mode: "Markdown",
                    }
                );
                const formattedPrice = data?.price
                    ?.toString()
                    ?.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                bot.sendMessage(
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
                bot.sendMessage(security[dbName]?.new_orders_chat_id, message, options).then((sentMessage) => {
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
                            chat_id: security[dbName]?.new_orders_chat_id,
                            message_id: msg_id,
                        }
                    );
                });
                callback({ message: "Success", status: 200 });
            } else {
                bot.sendMessage(
                    chatId,
                    `Iltimos buyurtma berishdan oldin ro'yxatdan o'ting! /start`
                );
                callback({ message: "User not registered", status: 400 });
                console.log("User not registered");
            }
        } catch (error) {
            callback({ message: "Internal Server Error", status: 500 });
            console.log("Error while sending message to admin:", error);
        }
    })
    socket.on(`/ask-delete/order`, async (id) => {
        try {
            const result = await o_controller.askDeleteOrder(3, id, dbName);
            if (result) {
                const { user_id, acc_id, start_date, start_hour, time, paid } = result[0];
                try {
                    const link = `[${user_id}](tg://user?id=${user_id})`;
                    const msg = `${link} ${id} ID dagi buyurtmani bekor qilmoqchi!\nBuyurtma:\nAccount: ${acc_id}\nBoshlanish vaqti: ${start_date}, ${start_hour}\nDavomiyligi: ${time}\nTo'lov: ${paid}\n\nBuyurtma bekor qilinsinmi?`;

                    const options = {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "Ha", callback_data: `delete_order_accept|${id}_${user_id}` }, { text: "Yo'q", callback_data: `delete_order_cancel|${id}_${user_id}` }]
                            ]
                        },
                        parse_mode: "Markdown",
                    }

                    bot.sendMessage(security[dbName]?.ask_cancel_chat_id, msg, options).then((sentMessage) => {
                        const msg_id = sentMessage.message_id;
                        bot.editMessageReplyMarkup(
                            {
                                inline_keyboard: [
                                    [{ text: "Ha", callback_data: `delete_order_accept|${id}_${user_id}_${msg_id}` }, { text: "Yo'q", callback_data: `delete_order_cancel|${id}_${user_id}_${msg_id}` }]
                                ],
                            },
                            {
                                chat_id: security[dbName]?.ask_cancel_chat_id,
                                message_id: msg_id,
                            }
                        );

                        bot.on('message', (msg) => {
                            if (msg.reply_to_message && msg.reply_to_message.message_id === msg_id) {
                                bot.sendMessage(user_id, `Admin javobi:\n\n${msg.text}!`);
                            }
                        });
                    });

                } catch (error) {
                    console.log("Error while sending message to admin:", error);
                }

            }
        } catch (error) {
        }
    })
}

module.exports = {
    setupRouterkHandlers,
}