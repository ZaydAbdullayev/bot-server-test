const knex = require("knex");
const dbConnections = {}; // Bağlantıları önbellekte tutacağız

const createDbConnection = (dbName) => {
    if (!dbConnections[dbName]) {
        dbConnections[dbName] = knex({
            client: "mysql",
            connection: {
                host: "161.97.137.120",
                user: "foodify",
                password: "Admin@1234",
                database: dbName,
                charset: "utf8mb4",
            },
            pool: { min: 1, max: 10 },
        });
        console.log(`Yeni bağlantı oluşturuldu: ${dbName}`);
        setTimeout(() => {
            if (dbConnections[dbName]) {
                dbConnections[dbName].destroy();
                delete dbConnections[dbName];
                console.log(`Bağlantı kapatıldı: ${dbName}`);
            }
        }, 15 * 60 * 1000);
    }

    return dbConnections[dbName];
};

module.exports = createDbConnection;
