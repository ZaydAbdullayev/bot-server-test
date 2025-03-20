const { adminChatIds } = require("../../mocks/security");
const service = require("../service/register.service");
const path = require("path");
const statePath = path.join(process.cwd(), 'mocks/state.js');
const state = require(statePath);
const { winners } = state;

const setupSendMessages = (bot) => {
    if (!bot) {
        throw new Error("Bot or service is not provided correctly.");
    }
    const sendMessage = async (chatId, message, options) => {
        try {
            await bot.sendMessage(chatId, message, options);
        } catch (error) {
            console.log(`${chatId} ga xabar yuborishda xatolik yuz berdi`);
        }
    };
    const sendPhoto = async (chatId, photo, message) => {
        try {
            await bot.sendPhoto(chatId, photo, message);
        } catch (error) {
            console.log(`${chatId} ga rasmlar yuborishda xatolik yuz berdi`);
        }
    };
    const sendVideoNote = async (chatId, video_note) => {
        try {
            await bot.sendVideoNote(chatId, video_note);
        } catch (error) {
            console.log(`${chatId} ga video yuborishda xatolik yuz berdi`);
        }
    };
    const sendVideo = async (chatId, video, message) => {
        try {
            await bot.sendVideo(chatId, video, message);
        } catch (error) {
            console.log(`${chatId} ga video yuborishda xatolik yuz berdi`);
        }
    };
    const sendLocation = async (chatId, latitude, longitude) => {
        try {
            await bot.sendLocation(chatId, latitude, longitude);
        } catch (error) {
            console.log(`${chatId} ga joylashuv yuborishda xatolik yuz berdi`);
        }
    };
    const sendMediaGroup = async (chatId, mediaGroup) => {
        try {
            await bot.sendMediaGroup(chatId, mediaGroup);
        } catch (error) {
            console.log(`${chatId} ga media guruhini yuborishda xatolik yuz berdi`);
        }
    };
    const sendMessagesToAdmins = async (user, adminMessage, k = false) => {
        for (const adminChatId of adminChatIds) {
            try {
                if (user?.video_note) {
                    await bot.sendVideoNote(adminChatId, user.video_note);
                }
            } catch (error) {
                continue;
            }

            try {
                if (user?.location?.latitude && user?.location?.longitude) {
                    await bot.sendLocation(
                        adminChatId,
                        user.location.latitude,
                        user.location.longitude
                    );
                }
            } catch (error) {
                continue;
            }

            try {
                if (user?.photo && Array.isArray(user.photo) && user.photo.length > 0) {
                    const mediaGroup = user.photo.map((photoId) => ({
                        type: "photo",
                        media: photoId,
                    }));

                    const options = {
                        caption: adminMessage,
                        parse_mode: "Markdown",
                        reply_markup: k
                            ? {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "✅ ✅ ✅",
                                            callback_data: `admin_accept|${user?.userId}`,
                                        },
                                        {
                                            text: "❌ ❌ ❌",
                                            callback_data: `admin_reject|${user?.userId}`,
                                        },
                                    ],
                                ],
                            }
                            : undefined,
                    };

                    await bot.sendMediaGroup(adminChatId, mediaGroup);
                    await bot.sendMessage(adminChatId, adminMessage, options);
                }
            } catch (error) {
                console.log("user pasport malumotlari yuborisda xatolik yuz berdi");
                continue;
            }
        }
    };
    const sendMessageForSuccess = async (adminMessage) => {
        for (const adminChatId of adminChatIds) {
            try {
                await bot.sendMessage(adminChatId, adminMessage, {
                    parse_mode: "Markdown",
                });
            } catch (error) {
                continue;
            }
        }
    };
    const sendMessageForSuccessUpdate = async (msg_id) => {
        for (const adminChatId of adminChatIds) {
            try {
                await bot.editMessageReplyMarkup(
                    { inline_keyboard: [], },
                    {
                        chat_id: adminChatId,
                        message_id: msg_id,
                    }
                )
            } catch (error) {
                continue;
            }
        }
    };
    const checkWinners = async (ids, chatId, message, type = null) => {
        try {
            const prizeTime =
                type === "Top"
                    ? { 1: 36, 2: 24, 3: 12, 4: 6, 5: 6 }
                    : { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 };
            for (const [i, id] of ids?.entries()) {
                try {
                    const user = winners?.[id] || { user_id: id, total_spent: 0 };
                    const result = await service.addUserToWinnersList({
                        ...user,
                        prize_time: prizeTime[i + 1],
                        rank_user: i + 1,
                    });
                    if (result) {
                        try {
                            await bot.sendMessage(
                                id,
                                `*Tabriklaymiz🎉🎉👏*\n\n*Siz konkursda g'olib bo'lib ${prizeTime[i + 1]
                                } soatga free akk yutib oldingiz!*\n\n*YUTUQNI OLISH UCHUN*👇\n*✍️ @ARENDA_ATOMIC ✅*`,
                                { parse_mode: "Markdown" }
                            );
                            Object.assign(winners[id], {});
                        } catch (error) {
                            bot.sendMessage(chatId, `${id} ga g'olib bo'lganligi haqidagi xabar jo'natishda xatolik yuz berdi`);
                        }
                    }
                } catch (error) {
                    console.log("ID error", error);
                    await bot.sendMessage(chatId, "ID raqamlarini to'g'ri yozing!");
                }
            }

            await bot.sendMessage(
                chatId,
                [
                    "*G'oliblar ro'yxati👇*\n",
                    ...message,
                    `\n*YUTUQNI OLISH UCHUN👇*\n*✍️ @ARENDA_ATOMIC ✅*`,
                ].join("\n"),
                { parse_mode: "Markdown" }
            );
            setTimeout(() => {
                Object.assign(winners, {});
            }, 1000);
        } catch (error) {
            console.log("Error sending winners list:", error);
            await bot.sendMessage(chatId, "G'oliblar ro'yxatini yuborishda xatolik yuz berdi");
        }
    };
    const deleteMessage = async (chatId, messageId) => {
        try {
            await bot.deleteMessage(chatId, messageId);
        } catch (error) {
            console.log(`${chatId} ga xabar o'chirishda xatolik yuz berdi`);
        }
    }
    const sendMessageToUsers = async (chatId, text, users, entities) => {
        await bot.sendMessage(chatId, `📤 Barcha foydalanuvchilarga habar jo'natilmoqda...`);

        let sentCount = 0;
        let blockedCount = 0;
        let failedCount = 0;
        let reportMessageId = null;

        const updateAdminReport = async () => {
            const reportText = `📊 *Habar yuborish holati:*\n✅ *Muvovvaqiyatli yuborildi:* ${users.length} / ${sentCount}\n🚫 *Botni blocklaganlar:* ${blockedCount}\n⚠️ *Xato holati:* ${failedCount}\n🔄 *Qolgan userlar:* ${users.length - (sentCount + blockedCount + failedCount)}`;

            if (reportMessageId) {
                await bot.editMessageText(reportText, {
                    chat_id: adminId,
                    message_id: reportMessageId,
                    parse_mode: "Markdown",
                }).catch(() => { });
            } else {
                const sentReport = await bot.sendMessage(chatId, reportText, { parse_mode: "Markdown" });
                reportMessageId = sentReport.message_id;
            }
        };

        users.forEach((user, index) => {
            setTimeout(() => {

                bot.sendMessage(user.user_id, text, { entities })
                    .then(() => {
                        sentCount++;
                        updateAdminReport();
                    })
                    .catch((error) => {
                        if (error.response?.body?.error_code === 403) {
                            blockedCount++;
                            console.log("Blocked user:", error.response);
                        } else {
                            failedCount++;
                            console.log("Failed user:", error.response);
                        }
                        updateAdminReport();
                    });
            }, index * 250 + Math.floor(index / 20) * 5000);
        });
    }

    return {
        sendMessagesToAdmins,
        sendMessageForSuccess,
        checkWinners,
        sendMessage,
        sendPhoto,
        sendMediaGroup,
        sendVideoNote,
        sendLocation,
        sendVideo,
        deleteMessage,
        sendMessageForSuccessUpdate,
        sendMessageToUsers,
    };
};

module.exports = {
    setupSendMessages,
};
