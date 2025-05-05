const QueryService = require("./query.service");
const o_controller = require("../controller/order.controller");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const dayjs = require("dayjs");

class UserService {
    static async getAllAccs(dbName) {
        const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
        const query = `
  SELECT
    a.*,
    DATE_ADD(o.end_date, INTERVAL 1 HOUR) AS order_end_date,
    o.end_hour AS order_end_hour
FROM accounts a
LEFT JOIN acc_orders o
    ON a.acc_id = o.acc_id
    AND o.end_date >= '${currentDate}'
    AND o.status = 5
    AND o.is_deleted != 5
WHERE
    a.short_name LIKE '#V%'
    OR a.short_name LIKE '#T%'
    OR a.short_name LIKE '#M%'
    OR a.short_name LIKE '#CH%'
ORDER BY
    CASE
        WHEN a.short_name LIKE '#V%' THEN 1
        WHEN a.short_name LIKE '#T%' THEN 2
        WHEN a.short_name LIKE '#M%' THEN 3
        WHEN a.short_name LIKE '#CH%' THEN 4
        ELSE 5
    END,
    CASE
        WHEN a.short_name LIKE '#CH%' THEN CAST(SUBSTRING(a.short_name, 4) AS UNSIGNED)
        ELSE CAST(SUBSTRING(a.short_name, 3) AS UNSIGNED)
    END ASC;

`;
        const result = await QueryService.dbQuery(dbName, query);
        const parsedData = JSON.parse(JSON.stringify(result));
        return parsedData;
    }
    static async getAccById(id, dbName) {
        try {
            const query = "SELECT * FROM accounts WHERE acc_id = ?";
            const result = await QueryService.dbQuery(dbName, query, [id]);
            if (!result || result.length === 0) {
                console.error("No account found for the given ID");
                return [];
            }
            const discount = await o_controller.getDiscounts(dbName);
            const { data: bonuses } = await o_controller.getActiveBonuses(dbName);
            const parsed_data = JSON?.parse(JSON?.stringify(result[0]));
            let price_list = JSON?.parse(parsed_data?.price_list);
            const discountItem = discount.length > 0 ? discount[0] : null;
            const bonusesMap = new Map(bonuses.map(bonus => [bonus.tarif, bonus]));


            price_list = price_list.map((item) => {
                const tarif = item.duration;
                return {
                    ...item,
                    discount: item.nightOnly ? null : discountItem,
                    bonus: item.nightOnly ? null : bonusesMap.get(tarif) || null,
                };
            });

            const data = {
                ...parsed_data,
                price_list,
                daily_price_list: JSON.parse(parsed_data.custom_price_list),
            };

            return data;
        } catch (error) {
            console.error("Error in getAccById:", error);
            return [];
        }

    }
    static async getAccsShortName(dbName) {
        try {
            const query = `
SELECT 
    CONCAT('[', GROUP_CONCAT(
        JSON_QUOTE(short_name)
        ORDER BY 
            CASE
                WHEN short_name LIKE '#V%' THEN 1
                WHEN short_name LIKE '#T%' THEN 2
                WHEN short_name LIKE '#M%' THEN 3
                WHEN short_name LIKE '#CH%' THEN 4
                ELSE 5
            END,
            CASE
                WHEN short_name LIKE '#CH%' THEN CAST(SUBSTRING(short_name, 4) AS UNSIGNED)
                ELSE CAST(SUBSTRING(short_name, 3) AS UNSIGNED)
            END ASC
    ), ']') AS short_names
FROM 
    accounts
WHERE 
    short_name LIKE '#V%'
    OR short_name LIKE '#T%'
    OR short_name LIKE '#M%'
    OR short_name LIKE '#CH%'
`;

            let result = await QueryService.dbQuery(dbName, query);
            result = JSON.parse(result[0].short_names);
            return result
        } catch (err) {
            console.log('eror:', err);
            return []
        }
    }
    static async updateAcc(acc, id, dbName) {
        const query = `
    UPDATE accounts 
    SET 
      acc_id = ?, 
      short_name = ?, 
      acc_name = ?, 
      description = ?, 
      video_id = ?, 
      imgs = ?, 
      owner_id = ?, 
      price_list = ?, 
      custom_price_list = ?, 
      status = ?,
      hour_by = ?
    WHERE acc_id = ?
  `;
        const values = [
            acc.acc_id,
            acc.short_name,
            acc.acc_name,
            acc.description,
            acc.video_id,
            JSON.stringify(acc.imgs),
            acc.owner_id,
            JSON.stringify(acc.price_list),
            JSON.stringify(acc.daily_price_list),
            acc.status,
            acc.hour_by,
            id
        ];
        const result = await QueryService.dbQuery(dbName, query, values);
        const s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0;
    }
    static async getImgUrl(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const base64Image = data.image.split(";base64,").pop();
                const imgBuffer = Buffer.from(base64Image, "base64");
                const processedImage = await sharp(imgBuffer)
                    .resize(400, 400)
                    .toBuffer();

                const originalname = data?.name;
                const unique = crypto?.randomBytes(3).toString("hex");
                const format = originalname?.split(".").pop();
                const name = `img_${unique}.${format}`;
                const imgDir = path.resolve(__dirname, "../../imgs");
                if (!fs.existsSync(imgDir)) {
                    fs.mkdirSync(imgDir, { recursive: true });
                }
                const filePath = path.join(imgDir, name);
                await sharp(processedImage).toFile(filePath);
                const url = `https://server.foodify.uz/${name}`;
                return resolve(url);
            } catch (err) {
                return reject(err);
            }
        });
    }
    static async changeUrl(data, oldUrl) {
        // delete old image from imgs folder
        const oldName = oldUrl.split("/").pop();
        const imgDir = path.resolve(__dirname, "../../imgs");
        const oldPath = path.join(imgDir, oldName);
        if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
        }
        // create new image
        const newurl = this.getImgUrl(data);
        return newurl;
    }
    static async getAccSalesListById(id, dbName) {
        try {
            const query = `
  SELECT 
    *,
    DATE_ADD(received_at, INTERVAL 1 HOUR) AS received_at,
    DATE_ADD(start_date, INTERVAL 1 HOUR) AS start_date,
    DATE_ADD(end_date, INTERVAL 1 HOUR) AS end_date
  FROM acc_orders 
  WHERE acc_id = ?
    AND status IN (0, 5)  
    AND is_deleted = 0 
    AND end_date >= CURDATE() 
  ORDER BY STR_TO_DATE(start_date, '%Y.%m.%d %h:%i:%s') ASC
`;

            const result = await QueryService.dbQuery(dbName, query, [id]);
            let parsedData = JSON.parse(JSON.stringify(result));

            return parsedData;
        } catch (err) {
            return { error: err.message };
        }
    }
    static async addAccFavouriteList(data, dbName) {
        const query = `INSERT INTO favourite_accs SET ?`
        const result = await QueryService.dbQuery(dbName, query, [data]);
        const s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0
    }
    static async removeAccFavouriteList(data, dbName) {
        const query = "DELETE FROM favourite_accs WHERE acc_id = ? AND user_id = ?";
        const result = await QueryService.dbQuery(dbName, query, [data.acc_id, data.user_id]);
        const s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0
    }
    static async getFavouriteList(user_id, dbName) {
        const query = "SELECT acc_id FROM favourite_accs WHERE user_id = ?";
        const result = await QueryService.dbQuery(dbName, query, [user_id]);
        let s = JSON.parse(JSON.stringify(result));
        s = s.map((item) => item.acc_id);
        return s;
    }
    static async addKonkurs(data, dbName) {
        // Önce status = 0 olan kayıt var mı diye kontrol et
        const checkQuery = "SELECT button_text FROM konkurs WHERE status = 0 LIMIT 1";
        const existingRow = await QueryService.dbQuery(dbName, checkQuery);

        let result;
        if (existingRow.length > 0) {
            const updateQuery = "UPDATE konkurs SET ? WHERE status = 0";
            result = await QueryService.dbQuery(dbName, updateQuery, [data]);
        } else {
            const insertQuery = "INSERT INTO konkurs SET ?";
            result = await QueryService.dbQuery(dbName, insertQuery, [data]);
        }

        const s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0;
    }
    static async updateKonkurs(data, status, dbName) {
        const query = "UPDATE konkurs SET ? WHERE status = ?";
        const result = await QueryService.dbQuery(dbName, query, [data, status]);
        const s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0;
    }
    static async getContestant(name, dbName) {
        const query = "SELECT * FROM konkurs WHERE name = ?";
        const result = await QueryService.dbQuery(dbName, query, [name]);
        const s = JSON.parse(JSON.stringify(result));
        return s[0];
    }
    static async getKonkurs(dbName) {
        const query = "SELECT * FROM konkurs";
        const result = await QueryService.dbQuery(dbName, query);
        const s = JSON.parse(JSON.stringify(result));
        return s;
    }
    static async updateKonkursStatus(name, status, dbName) {
        const query = "UPDATE konkurs SET status = ? WHERE name = ?";
        const result = await QueryService.dbQuery(dbName, query, [status, name]);
        const s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0;
    }
    static async deleteKonkurs(name, dbName) {
        const query = "DELETE FROM konkurs WHERE name = ?";
        const result = await QueryService.dbQuery(dbName, query, [name]);
        const s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0;
    }
    static async getUsersSpins(userId, dbName) {
        const query = `SELECT * FROM spins WHERE user_id = ?`;
        const result = await QueryService.dbQuery(dbName, query, [userId]);
        const s = JSON.parse(JSON.stringify(result));
        return s[0];
    }
    static async updateUserSpins(userId, spins, dbName) {
        const query = `UPDATE spins SET spin_count = ? WHERE user_id = ?`;
        const result = await QueryService.dbQuery(dbName, query, [spins, userId]);
        const s = JSON.parse(JSON.stringify(result));
        return s.affectedRows > 0;
    }

}

module.exports = UserService;
