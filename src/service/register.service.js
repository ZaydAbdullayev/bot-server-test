const { calculateEndDateTime, calculateAdjustedTime } = require("../utils/services");
const db = require("./query.service");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

class RegisterService {
    static async checkIfRegistered(userId, dbName) {
        const query = "SELECT * FROM users WHERE user_id = ?";
        try {
            const result = await db.dbQuery(dbName, query, [userId]);
            return result.length > 0;
        } catch (error) {
            console.error(1);
            throw error;
        }
    }
    static async fetchAllUsers(dbName) {
        try {
            const query = "SELECT * FROM users";
            const results = await db.dbQuery(dbName, query);
            return results;
        } catch (error) {
            console.error(2);
            throw error;
        }
    }
    static async fetchUserById(id, dbName) {
        try {
            const query = "SELECT * FROM users WHERE user_id = ?";
            const result = await db.dbQuery(dbName, query, [id]);
            const user = result[0];
            return user;
        } catch (error) {
            throw error;
        }
    }
    static async getParticipants(dbName) {
        try {
            const query = "SELECT * FROM users";
            const results = await db.dbQuery(dbName, query);
            return results;
        } catch (error) {
            console.error(2);
            throw error;
        }
    };
    static async addParticipant(userId, dbName) {
        try {
            const query = "INSERT INTO participants (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)";
            const result = await db.dbQuery(dbName, query, [userId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error(3);
            throw error;
        }
    }
    static async handleAdminResponse(user, dbName) {
        try {
            const query = `INSERT INTO users (user_id, name, photo, longitude, latitude, phone, username) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), photo = VALUES(photo), longitude = VALUES(longitude), latitude = VALUES(latitude), phone = VALUES(phone), username = VALUES(username)`;
            const values = [
                user?.userId,
                user?.name || "",
                JSON.stringify(user?.photo) || "",
                user?.location?.longitude,
                user?.location?.latitude,
                user?.phone,
                `[${user?.name}](tg://user?id=${user?.userId})`,
            ];

            const result = await db.dbQuery(dbName, query, values);
            const s = JSON.parse(JSON.stringify(result));
            return s.affectedRows > 0;
        } catch (err) {
            console.error(err);
        }
    }
    static async handleUserResponse(user, action_hour, botmode = null, dbName) {
        try {
            const date = user?.start_time?.split(" - ");
            user.start_date = date?.[0];
            user.start_hour = date?.[1];
            delete user.start_time;

            const data = calculateEndDateTime(user);

            const query = `INSERT INTO acc_orders (user_id, acc_id, paid, time, shablon_id, imgs, status, start_date, start_hour, end_date, end_hour, mobile_info, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE acc_id = VALUES(acc_id), paid = VALUES(paid), time = VALUES(time), shablon_id = VALUES(shablon_id), imgs = VALUES(imgs), status = VALUES(status), start_date = VALUES(start_date), start_hour = VALUES(start_hour), end_date = VALUES(end_date), end_hour = VALUES(end_hour), mobile_info = VALUES(mobile_info), location = VALUES(location)`;
            const imgsValue =
                user?.imgs && user?.imgs?.length > 0 ? JSON.stringify(user.imgs) : "[]";
            const status = botmode ? 5 : 0;

            const values = [
                data.user_id,
                data.acc_id,
                data.paid,
                data.time,
                data.id,
                imgsValue,
                status,
                `${data.start_date} ${data.start_hour}`,
                data.start_hour,
                `${data.end_date} ${data.end_hour}`,
                data.end_hour,
                user.mobile_info || '',
                JSON.stringify(user.location) || '[]',
            ];

            const result = await db.dbQuery(dbName, query, values);
            const s = JSON.parse(JSON.stringify(result));

            if (s.affectedRows > 0) {
                const hour = botmode ? 8 : 4;
                const adjustedStartHour = calculateAdjustedTime(data.start_date, action_hour, hour);
                const adjustedEndHour = calculateAdjustedTime(data.end_date, data.end_hour, hour);
                // Start timer event query start_timer_${data.id}
                const startTimerQuery = `
            UPDATE acc_orders
            SET status = 5
            WHERE acc_id = '${data.acc_id}' AND shablon_id = '${data.id}';
            UPDATE accounts
            SET status = 1
            WHERE acc_id = '${data.acc_id}';
      `;
                // End timer event query end_timer_${data.id}
                const endTimerQuery = `
            UPDATE acc_orders 
            SET status = 1 
            WHERE acc_id = '${data.acc_id}' AND shablon_id = '${data.id}';
            UPDATE accounts
            SET status = 0
            WHERE acc_id = '${data.acc_id}';
      `;
                // Execute both queries separately
                if (!botmode) {
                    await db.createEvent(dbName, `start_timer_${data.id}`, adjustedStartHour, startTimerQuery);
                }
                await db.createEvent(dbName, `end_timer_${data.id}`, adjustedEndHour, endTimerQuery);

            }

            return s.affectedRows > 0;
        } catch (error) {
            console.error("Query Error:", error);
            return false;
        }
    }
    static async calcPriceByAcc(number, dbName) {
        try {
            const sql = `SELECT sum(paid) as total_price FROM acc_orders WHERE acc_id = ? AND payment_status = 0`;
            const result = await db.dbQuery(dbName, sql, [number]);

            return result[0].total_price ? result[0].total_price : 0;


        } catch (error) {
            throw error;
        }
    }
    static async updatePaymentStatus(acc_id, dbName) {
        try {
            const query = `UPDATE acc_orders SET payment_status = 1 WHERE acc_id = ?`;
            const result = await db.dbQuery(dbName, query, [acc_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }
    static async calcEarnings(type, customTime = {}, dbName) {
        const currentUTCDate = dayjs().utc();
        let startTimestamp, endTimestamp;

        if (type === 'daily') {
            startTimestamp = currentUTCDate.startOf('day').hour(6);
            endTimestamp = startTimestamp.add(20, 'hours'); // 6 AM to 2 AM next day
        } else if (type === 'weekly') {
            startTimestamp = currentUTCDate.startOf('week').add(1, 'day').hour(6); // Monday 6 AM
            endTimestamp = currentUTCDate.endOf('week').hour(23).minute(59).second(59);
        } else if (type === 'monthly') {
            startTimestamp = currentUTCDate.date(25).hour(5).minute(0).second(0);
            if (currentUTCDate.date() < 25) {
                startTimestamp = startTimestamp.subtract(1, 'month'); // Go back one month if today is before the 25th
            }
            endTimestamp = startTimestamp.add(1, 'month').hour(2).minute(0).second(0);
        } else if (type === "all_time") {
            startTimestamp = dayjs('2025-01-01 00:00:00');
            endTimestamp = currentUTCDate.endOf('day');
        } else if (type === "custom_time") {
            console.log("calisdi");
            // Custom time format: { start: 'dd.mm.yyyy', end: 'dd.mm.yyyy' } convert to yyyy-mm-dd hh:mm:ss
            startTimestamp = dayjs(customTime.start, 'DD.MM.YYYY').hour(6);
            endTimestamp = dayjs(customTime.end, 'DD.MM.YYYY').hour(2).add(1, 'day');

        } else {
            throw new Error('Invalid type specified');
        }


        const formattedStartTimestamp = startTimestamp.toISOString().slice(0, 19).replace('T', ' ');
        const formattedEndTimestamp = endTimestamp.toISOString().slice(0, 19).replace('T', ' ');
        console.log(formattedStartTimestamp, formattedEndTimestamp);

        const accOrders1 = await db.dbQuery(dbName, `
          SELECT 
    a.acc_id,
    a.my_fee,
    CASE 
        WHEN a.owner_id IN (1, 5) THEN 'my_accs'
        ELSE 'others_accs'
    END AS category,
    COALESCE(SUM(ao.paid), 0) AS total
FROM 
    accounts a
LEFT JOIN 
    acc_orders ao 
    ON a.acc_id = ao.acc_id 
    AND ao.received_at >= '${formattedStartTimestamp}' 
    AND ao.received_at <= '${formattedEndTimestamp}'
GROUP BY 
    a.acc_id, a.owner_id, a.my_fee
ORDER BY 
    category, total DESC;

        `);
        const accOrders = JSON.parse(JSON.stringify(accOrders1));
        const result = accOrders.reduce(
            (acc, row) => {
                const { category, my_fee, total } = row;

                if (category === 'my_accs') {
                    acc.my_accs.push(row);
                    acc.my_profit += total; // Full earnings from my own accounts
                } else {
                    acc.others_accs.push(row);

                    // My share from others' accounts (my_fee is the percentage I get)
                    acc.my_profit_from_others += total * (my_fee / 100);

                    // Others' profit (the remaining amount)
                    acc.others_profit += total * ((100 - my_fee) / 100);
                }

                // Total revenue from all accounts
                acc.total_money_made += total;

                return acc;
            },
            {
                my_accs: [],
                others_accs: [],
                my_profit: 0, // Earnings from my own accounts
                my_profit_from_others: 0, // Earnings from other accounts via fees
                others_profit: 0, // What other account owners keep
                total_money_made: 0, // Total revenue from all accounts
            }
        );
        const formatPrice = (price) => {
            return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        };
        const my_accs_message = result.my_accs.map((row) => {
            return `*${row.acc_id} — ${formatPrice(row.total)} so'm🧾*\n`;
        }).join('\n');
        const others_accs_message = result.others_accs.map((row) => {
            return `*${row.acc_id} — ${formatPrice(row.total)} so'm🧾*\n`;
        }).join('\n');
        const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
        const finalMessage = `*${capitalizedType.split("_").join(" ")} PROFIT👇*\n\n${others_accs_message}\n➖➖➖➖➖➖➖➖➖➖\n*OTHERS' PROFIT — ${formatPrice(result.others_profit)} so'm👌*\n*MY PROFIT — ${formatPrice(result.my_profit_from_others)} so'm👌*\n*➖➖➖➖➖➖➖➖➖➖*\n${my_accs_message}\n*➖➖➖➖➖➖➖➖➖➖*\n*FROM MY ACCS — ${formatPrice(result.my_profit)} so'm🔥*\n*➖➖➖➖➖➖➖➖➖➖*\n* 💰MINE: ${formatPrice(result.my_profit + result.my_profit_from_others)} so'm✅ *\n* 💰ALL: ${formatPrice(result.total_money_made)} so'm✅*`;
        return finalMessage;
    }
    static async rankUsersByTotalPayments(dbName) {
        const query = `SELECT user_id, SUM(paid) AS total_spent FROM acc_orders WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY user_id ORDER BY total_spent DESC LIMIT 5;`;
        try {
            const results = await db.dbQuery(dbName, query);

            return results.map((user, index) => ({
                rank: index + 1,
                user_id: user.user_id,
                total_spent: user.total_spent,
            }));
        } catch (error) {
            console.error("Error ranking users by total payments:", error);
            throw error;
        }
    }
    static async getRandomIdsExcludingTop5(dbName) {
        const top5Query = `
    SELECT user_id
    FROM (
        SELECT user_id, SUM(paid) AS total_spent
        FROM acc_orders 
        WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
        GROUP BY user_id
        ORDER BY total_spent DESC 
        LIMIT 5
    ) AS top5
    `;

        const allIdsQuery = `
    SELECT user_id, COUNT(*) AS count
    FROM acc_orders 
    WHERE received_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
    AND user_id NOT IN (${top5Query})
    GROUP BY user_id;
    `;

        try {
            const allIds = await db.dbQuery(dbName, allIdsQuery);
            const weightedIds = allIds.reduce((acc, order) => {
                const ids = new Array(order.count).fill(order.user_id); // 'user_id' olmalı
                return acc.concat(ids);
            }, []);
            const shuffledIds = weightedIds.sort(() => 0.5 - Math.random());
            const uniqueSelectedIds = new Set();
            while (uniqueSelectedIds.size < 5 && shuffledIds.length > 0) {
                const randomIndex = Math.floor(Math.random() * shuffledIds.length);
                const selectedId = shuffledIds[randomIndex];
                uniqueSelectedIds.add(selectedId);
                shuffledIds.splice(randomIndex, 1); // Seçilen ID'yi çıkar
            }
            return Array.from(uniqueSelectedIds);
        } catch (error) {
            console.error("Error fetching random IDs:", error);
            throw error;
        }
    }
    static async addUserToWinnersList(user, dbName) {
        try {
            const query = `INSERT INTO winners (user_id, prize_time, money_spent, rank_user) VALUES (?, ?, ?, ?)`;
            const result = await db.dbQuery(dbName, query, [
                user.user_id,
                user.prize_time,
                user.total_spent,
                user.rank_user,
            ]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Error adding user to winners list:", error);
            throw error;
        }
    }
    static async fetchWinner(id, dbName) {
        try {
            const query = `SELECT * FROM winners WHERE user_id = ? AND status = 0`;
            const result = await db.dbQuery(dbName, query, [id]);
            return result?.length > 0 ? result[0] : null;
        } catch (error) {
            console.error("Error fetching winner:", error);
            throw error;
        }
    }
    static async addAcc(acc, id, dbName) {
        const daily_price_list = Object.values(acc.daily_price_list);
        const query = `INSERT INTO accounts (acc_id, short_name, acc_name, description, video_id, imgs, owner_id, price_list, custom_price_list, hour_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE short_name = VALUES(short_name), acc_name = VALUES(acc_name), description = VALUES(description), video_id = VALUES(video_id), imgs = VALUES(imgs), owner_id = VALUES(owner_id), price_list = VALUES(price_list), custom_price_list = VALUES(custom_price_list), hour_by = VALUES(hour_by)`;
        const values = [
            id,
            acc.short_name,
            acc.acc_name,
            acc.description,
            acc.video_id,
            JSON.stringify(acc.imgs),
            acc.owner_id,
            JSON.stringify(acc.price_list),
            JSON.stringify(daily_price_list),
            acc.hour_by,
        ];

        try {
            const result = await db.dbQuery(dbName, query, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Error adding acc:", error);
            throw error;
        }
    }
}

module.exports = RegisterService;
