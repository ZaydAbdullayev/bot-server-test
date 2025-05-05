const service = require("../service/user.service");
const rg_service = require("../service/register.service");

class UserController {
    async getAllAccs(dbName) {
        try {
            const data = await service.getAllAccs(dbName);
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
    async getAccById(id, dbName) {
        try {
            const data = await service.getAccById(id, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async addAcc(accData, dbName) {
        try {
            const id = accData?.short_name;
            const result = await rg_service.addAcc(accData, id, dbName);
            if (result) {
                return { message: "ACC added successfully!", status: 200 };
            } else {
                return { message: "Failed to add ACC!", status: 400 };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    async deleteAcc(id, dbName) {
        try {
            const result = await rg_service.deleteAcc(id, dbName);
            if (result) {
                return { message: "ACC deleted successfully!", status: 200 };
            } else {
                return { message: "Failed to delete ACC!", status: 400 };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    async getAccsShortName(dbName) {
        try {
            const result = await service.getAccsShortName(dbName);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }
    async updateAcc(data, dbName) {
        try {
            const result = await service.updateAcc(data, data?.acc_id, dbName);
            if (result) {
                return { message: "ACC updated successfully!", status: 200 };
            } else {
                return { message: "Failed to update ACC!", status: 400 };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    async getAccSalesListById(id, dbName) {
        try {
            const data = await service.getAccSalesListById(id, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async addAccFavouriteList(data, dbName) {
        try {
            const result = await service.addAccFavouriteList(data, dbName);
            if (result) {
                return { message: "Added to favorite list!", status: 200 };
            } else {
                return { message: "Failed to add to favorite list!", status: 400 };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    async removeAccFavouriteList(data, dbName) {
        try {
            const result = await service.removeAccFavouriteList(data, dbName);
            if (result) {
                return { message: "delted to favorite list!", status: 200 };
            } else {
                return { message: "Failed to delete to favorite list!", status: 400 };
            }
        } catch (error) {
            return { error: error.message };
        }
    }
    async getFavouriteList(userId, dbName) {
        try {
            const data = await service.getFavouriteList(userId, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async addKonkurs(konkursData, dbName) {
        try {
            const data = await service.addKonkurs(konkursData, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async updateKonkurs(value, status, dbName) {
        try {
            const data = await service.updateKonkurs(value, status, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async getContestant(name, dbName) {
        try {
            const data = await service.getContestant(name, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async getMyKonkurs(dbName) {
        try {
            const data = await service.getKonkurs(dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async updateKonkursStatus(name, status, dbName) {
        try {
            const data = await service.updateKonkursStatus(name, status, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async deleteKonkurs(name, dbName) {
        try {
            const data = await service.deleteKonkurs(name, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async getUsersSpins(userId, dbName) {
        try {
            const data = await service.getUsersSpins(userId, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
    async updateUserSpins(userId, spins, dbName) {
        try {
            const data = await service.updateUserSpins(userId, spins, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new UserController();
