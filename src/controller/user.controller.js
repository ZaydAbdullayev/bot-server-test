const service = require("../service/user.service");
const rg_service = require("../service/register.service");

class UserController {
    async getAllAccs() {
        try {
            const data = await service.getAllAccs();
            const parsedData = JSON.parse(JSON.stringify(data));
            const result = parsedData.map((acc) => {
                const imgs = JSON.parse(acc.imgs);
                return {
                    ...acc,
                    imgs,
                };
            });
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }
    async getAccById(id) {
        try {
            const data = await service.getAccById(id);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async addAcc(accData) {
        try {
            const id = accData?.short_name;
            const result = await rg_service.addAcc(accData, id);
            if (result) {
                return { message: "ACC added successfully!", status: 200 };
            } else {
                return { message: "Failed to add ACC!", status: 400 };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    async getAccsShortName() {
        try {
            const result = await service.getAccsShortName();
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }
    async updateAcc(data) {
        try {
            const result = await service.updateAcc(data, data?.acc_id);
            if (result) {
                return { message: "ACC updated successfully!", status: 200 };
            } else {
                return { message: "Failed to update ACC!", status: 400 };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    async getAccSalesListById(id) {
        try {
            const data = await service.getAccSalesListById(id);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async addAccFavouriteList(data) {
        try {
            const result = await service.addAccFavouriteList(data);
            if (result) {
                return { message: "Added to favorite list!", status: 200 };
            } else {
                return { message: "Failed to add to favorite list!", status: 400 };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    async removeAccFavouriteList(data) {
        try {
            const result = await service.removeAccFavouriteList(data);
            if (result) {
                return { message: "delted to favorite list!", status: 200 };
            } else {
                return { message: "Failed to delete to favorite list!", status: 400 };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    async getFavouriteList(userId) {
        try {
            const data = await service.getFavouriteList(userId);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async addKonkurs(konkursData) {
        try {
            const data = await service.addKonkurs(konkursData);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async updateKonkurs(value, status) {
        try {
            const data = await service.updateKonkurs(value, status);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async getContestant(name) {
        try {
            const data = await service.getContestant(name);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new UserController();
