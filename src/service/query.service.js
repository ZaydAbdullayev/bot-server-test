const createDbConnection = require("../../config");

class QueryService {
    static async dbQuery(dbName, query, values = []) {
        const db = createDbConnection(dbName); // Dinamik bağlantı oluştur
        try {
            const result = await db.raw(query, values);
            return result[0];
        } catch (err) {
            console.error("Error executing query:", err);
            throw err;
        }
    }

    static async createEvent(dbName, eventName, scheduleTime, updateStatusQuery) {
        const db = createDbConnection(dbName);

        try {
            // Önce varsa eski eventi sil
            await db.raw(`DROP EVENT IF EXISTS \`${eventName}\`;`);

            const eventQuery = `
            CREATE EVENT \`${eventName}\`
            ON SCHEDULE AT '${scheduleTime}'
            DO 
            BEGIN 
                ${updateStatusQuery}
            END;
        `;

            await db.raw(eventQuery);
            return { msg: `Event ${eventName} created successfully`, success: true };
        } catch (err) {
            console.error(`Error creating event ${eventName}:`, err);
            return { msg: `Error creating event ${eventName}: ${err}`, success: false };
        }
    }



    static async dropEvent(dbName, eventName) {
        const db = createDbConnection(dbName);

        try {
            await db.raw(`DROP EVENT IF EXISTS ${eventName};`);
            return { msg: `Event ${eventName} dropped successfully`, success: true };
        } catch (err) {
            console.error(`Error dropping event ${eventName}:`, err);
            return { msg: `Error dropping event ${eventName}: ${err}`, success: false };
        }
    }
}

module.exports = QueryService;
