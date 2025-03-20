const { setupSendMessages } = require("./response");
const service = require("../service/register.service");
const { chunkArray } = require("../utils/services");
const u_controller = require("../controller/user.controller");

const setupReports = (bot) => {
    if (!bot) {
        throw new Error("Bot or service is not provided correctly.");
    }
    const {
        sendMessage,
        deleteMessage,
    } = setupSendMessages(bot);

    const daily = async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Kunlik hisobot tayyorlanmoqda!",
            show_alert: false,
        });
        try {
            const earnings = await service.calcEarnings("daily");
            sendMessage(chatId, earnings, { parse_mode: "Markdown" });
        } catch (error) {
            console.error("Error calculating daily earnings:", error);
            sendMessage(
                chatId,
                "Kunlik daromadlarni hisoblashda xatolik yuz berdi."
            );
        }
    };
    const weekly = async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Haftalik hisobot tayyorlanmoqda!",
            show_alert: false,
        });
        try {
            const earnings = await service.calcEarnings("weekly");
            sendMessage(chatId, earnings, { parse_mode: "Markdown" });
        } catch (error) {
            console.error("Error calculating weekly earnings:", error);
            sendMessage(
                chatId,
                "Haftalik daromadlarni hisoblashda xatolik yuz berdi."
            );
        }
    };
    const monthly = async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Oylik hisobot tayyorlanmoqda!",
            show_alert: false,
        });
        try {
            const earnings = await service.calcEarnings("monthly");
            sendMessage(chatId, earnings, { parse_mode: "Markdown" });
        } catch (error) {
            console.error("Error calculating monthly earnings:", error);
            sendMessage(
                chatId,
                "Oylik daromadlarni hisoblashda xatolik yuz berdi."
            );
        }
    };
    const all_time = async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Barcha hisobot tayyorlanmoqda!",
            show_alert: false,
        });
        try {
            const earnings = await service.calcEarnings("all_time");
            sendMessage(chatId, earnings, { parse_mode: "Markdown" });
        } catch (error) {
            console.error("Error calculating all_time earnings:", error);
            sendMessage(
                chatId,
                "Barcha daromadlarni hisoblashda xatolik yuz berdi."
            );
        }
    };
    const custom_time = async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        bot.sendMessage(chatId, "*VAQT ORALIGINI QUYIDAGI SHAKLDA YOZING*:\n\n`01.22.2025-02.14.2025`", {
            reply_markup: {
                force_reply: true,
            },
            parse_mode: "Markdown",
        }).then((s_msg) => {
            bot.answerCallbackQuery(callbackQuery.id, {
                text: "Vaqtga ko'ra hisobot tayyorlanmoqda!",
                show_alert: false,
            });
            bot.onReplyToMessage(chatId, s_msg.message_id, async (reply) => {
                const text = reply.text;
                try {
                    const [start, end] = text.split("-").map((t) => t.trim());
                    const earnings = await service.calcEarnings("custom_time", { start, end });
                    sendMessage(chatId, earnings, { parse_mode: "Markdown" });
                    deleteMessage(chatId, s_msg.message_id);
                } catch (error) {
                    bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Kutilmagan xatolik yuz berdi. Vaqt formatini tekshirib qayta urinib ko'ring!",
                        show_alert: true,
                    });
                }
            });
        }).catch((error) => {
            console.warn("Error sending custom time message:", error);
            sendMessage(chatId, "Hisoblashda xatolik yuz berdi.");
        });
    };
    const id_by = async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        bot.answerCallbackQuery(callbackQuery.id, {
            text: "Akkountlar ro'yxati olinmoqda!",
            show_alert: false,
        });
        try {
            const s = await u_controller.getAccsShortName()
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
        } catch (error) {
            sendMessage(
                chatId,
                "Akkountlar ro'yxatini olishda xatolik yuz berdi."
            );
        }
    };

    return {
        daily,
        weekly,
        monthly,
        all_time,
        custom_time,
        id_by,
    };
};

module.exports = { setupReports };