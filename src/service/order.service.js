const db = require("./query.service");
const { generateId, calculateEndTime, calculateAdjustedTime, is_before } = require("../utils/services");

class OrderService {
    static async getMyOrders(user_id, dbName) {
        const query = `
    SELECT 
        acc_orders.*, 
        accounts.video_id AS video_id,
        accounts.acc_name AS acc_name,
        DATE_ADD(acc_orders.end_date, INTERVAL 1 HOUR) AS end_date,
        DATE_ADD(acc_orders.start_date, INTERVAL 1 HOUR) AS start_date
    FROM 
        acc_orders 
    JOIN 
        accounts ON acc_orders.acc_id = accounts.acc_id 
    WHERE 
        acc_orders.user_id = ? 
        AND acc_orders.status = 0
        AND acc_orders.is_deleted != 5
    ORDER BY 
        acc_orders.received_at DESC
`;
        const result = await db.dbQuery(dbName, query, [user_id]);
        let s = JSON.parse(JSON.stringify(result));
        return s;
    }

    static async askDeleteOrder(status, id, dbName) {
        const query = `UPDATE acc_orders SET is_deleted = ? WHERE shablon_id = ?`;
        const result = await db.dbQuery(dbName, query, [status, id]);
        let s = JSON.parse(JSON.stringify(result));
        if (s.affectedRows > 0) {
            const query = `SELECT * FROM acc_orders WHERE shablon_id = ?`;
            const updateAcc = `UPDATE accounts SET status = 0 WHERE acc_id = ?`;
            const order = await db.dbQuery(dbName, query, [id]);
            const orderData = JSON.parse(JSON.stringify(order));
            if (orderData[0].status === 1) {
                await db.dbQuery(dbName, updateAcc, [orderData[0].acc_id]);
            }
            s = orderData;
        } else {
            s = false;
        }
        return s;
    }

    static async updateOrder(data, id, dbName) {
        const query = `UPDATE acc_orders SET ? WHERE shablon_id = ?`;
        const result = await db.dbQuery(dbName, query, [data, id]);
        let s = JSON.parse(JSON.stringify(result));
        if (s.affectedRows > 0) {
            const query = `SELECT * FROM acc_orders WHERE shablon_id = ?`;
            const result = await db.dbQuery(dbName, query, [id]);
            s = JSON.parse(JSON.stringify(result));
        } else {
            s = false;
        }
        return s;
    }

    static async updateFullOrder(data, id, dbName) {
        const query = `SELECT * FROM acc_orders WHERE shablon_id = ?`;
        const u_query = `UPDATE acc_orders SET ? WHERE shablon_id = ?`;
        const u_a_query = `UPDATE accounts SET status = 0 WHERE acc_id = ?`;

        let order = await db.dbQuery(dbName, query, [id]);
        order = JSON.parse(JSON.stringify(order[0]));
        const started = is_before(order.start_date);
        let result = await db.dbQuery(dbName, u_query, [data, id]);
        if (started) {
            result = await db.dbQuery(dbName, u_a_query, [order.acc_id]);
        }
        order.acc_id = data.acc_id;
        return result.affectedRows > 0 ? order : false;
    }


    static async createOrUpdateEvent(type, data, id, dbName) {
        const adjustedStartHour = calculateAdjustedTime(data.start_date?.split("T")[0], data.start_hour, 4);
        const adjustedEndHour = calculateAdjustedTime(data.end_date?.split("T")[0], data.end_hour, 4);
        let result = false;

        try {
            switch (type) {
                case "start":
                    const startUpdateQuery = `
                    UPDATE accounts
                    SET status = 1
                    WHERE acc_id = '${data.acc_id}';
                    `;
                    result = await db.createEvent(dbName, `start_timer_${id}`, adjustedStartHour, startUpdateQuery);
                    break;

                case "end":
                    const endUpdateQuery = `
                    UPDATE accounts
                    SET status = 0
                    WHERE acc_id = '${data.acc_id}';
                `;
                    result = await db.createEvent(dbName, `end_timer_${id}`, adjustedEndHour, endUpdateQuery);
                    break;

                default:
                    const startDefaultQuery = `
                    UPDATE accounts
                    SET status = 1
                    WHERE acc_id = '${data.acc_id}';
                `;
                    const endDefaultQuery = `
                    UPDATE accounts
                    SET status = 0
                    WHERE acc_id = '${data.acc_id}';
                `;
                    result = await db.createEvent(dbName, `start_timer_${id}`, adjustedStartHour, startDefaultQuery);
                    result = await db.createEvent(dbName, `end_timer_${id}`, adjustedEndHour, endDefaultQuery);
                    break;
            }
            return result.success;
        } catch (error) {
            console.error("Event oluşturulurken hata oluştu:", error);
        }
    }

    static async createDiscount(data, dbName) {
        data.discount_id = generateId();
        const query = `INSERT INTO discount (discount_id, amount, deedline, end_time, status) VALUES (?, ?, ?, ?, 1)`;
        const { for_event, for_sql } = calculateEndTime(data.deedline);

        try {
            const result = await db.dbQuery(dbName, query, [data.discount_id, data.amount, data.deedline, for_sql]);
            await db.createEvent(dbName,
                `discount_timer_${data.discount_id}`,
                for_event,
                `UPDATE discount SET status = 0 WHERE discount_id = '${data.discount_id}';`
            );
            const s = JSON.parse(JSON.stringify(result));
            return s.affectedRows > 0;
        } catch (error) {
            console.error(`Error in createDiscount: ${error}`);
            throw error;
        }
    }

    static async getActiveDiscounts(dbName) {
        const query = `SELECT * FROM discount WHERE status = 1;`;
        const result = await db.dbQuery(dbName, query);
        let s = JSON.parse(JSON.stringify(result));
        return s;
    }

    static async deleteDiscount(discountId, dbName) {
        const query = `UPDATE discount SET status = 0 WHERE discount_id = ?`;
        const result = await db.dbQuery(dbName, query, [discountId]);
        let s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0;
    }

    static async createBonus(data, dbName) {
        const query = `INSERT INTO bonus (collection_name, tarif, amount, deadline, end_time, status) VALUES (?, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE deadline = VALUES(deadline), end_time = VALUES(end_time), status = 1`;
        const { for_sql, for_event } = calculateEndTime(data.deedline);

        try {
            const result = await db.dbQuery(dbName, query, [data.collection_name, data.tarif, data.amount, data.deedline, for_sql]);
            const s = JSON.parse(JSON.stringify(result));
            return s.affectedRows > 0 ? for_event : false;
        } catch (error) {
            console.error(`Error in createbonus: ${error}`);
            throw error;
        }
    }

    static async getActiveBonuses(dbName) {
        const query = `SELECT * FROM bonus WHERE status = 1;`;
        const result = await db.dbQuery(dbName, query);
        let s = JSON.parse(JSON.stringify(result));
        const groupedResults = s.reduce((acc, curr) => {
            const existingGroup = acc.find(group => group[0].collection_name === curr.collection_name);
            if (existingGroup) {
                existingGroup.push(curr);
            } else {
                acc.push([curr]);
            }
            return acc;
        }, []);
        return { group_data: groupedResults, data: s };
    }

    static async getBonusesList(dbName) {
        const query = `SELECT * FROM bonus`;
        const result = await db.dbQuery(dbName, query);
        let s = JSON.parse(JSON.stringify(result));
        const groupedResults = s.reduce((acc, curr) => {
            const existingGroup = acc.find(group => group[0].collection_name === curr.collection_name);
            if (existingGroup) {
                existingGroup.push(curr);
            } else {
                acc.push([curr]);
            }
            return acc;
        }, []);
        return groupedResults;
    }

    static async passiveBonus(tarif, dbName) {
        const query = `UPDATE bonus SET status = 0 WHERE collection_name = ?`;
        const result = await db.dbQuery(dbName, query, [tarif]);
        let s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0;
    }

    static async activateBonus(collection_name, deadline, dbName) {
        const { for_event, for_sql } = calculateEndTime(deadline);
        const query = `UPDATE bonus SET status = 1, deadline = ?, end_time = ? WHERE collection_name = ?`;
        try {
            const result = await db.dbQuery(dbName, query, [deadline, for_sql, collection_name]);
            await db.createEvent(dbName,
                `bonus_timer_${collection_name}`,
                for_event,
                `UPDATE bonus SET status = 0 WHERE collection_name = '${collection_name}';`
            );

            const s = JSON.parse(JSON.stringify(result));
            return s.affectedRows > 0;
        } catch (error) {
            console.error(`Error in createbonus: ${error}`);
            throw error;
        }

    }

    static async deleteBonus(collection_name, dbName) {
        const query = `DELETE FROM bonus WHERE collection_name = ?`;
        const result = await db.dbQuery(dbName, query, [collection_name]);
        let s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0;
    }
}

module.exports = OrderService;