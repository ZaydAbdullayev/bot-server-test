const service = require("../service/order.service");

class OrderController {
    async getMyOrders(userId, dbName) {
        try {
            const data = await service.getMyOrders(userId, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }

    async askDeleteOrder(status, orderId, dbName) {
        try {
            const data = await service.askDeleteOrder(status, orderId, dbName);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }

    async updateOrder(data, orderId, dbName) {
        try {
            const result = await service.updateOrder(data, orderId, dbName);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async updateFullOrder(data, orderId, dbName) {
        try {
            const result = await service.updateFullOrder(data, orderId, dbName);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async createOrUpdateEvent(type, data, orderId, dbName) {
        try {
            const result = await service.createOrUpdateEvent(type, data, orderId, dbName);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async createDiscount(data, dbName) {
        try {
            const result = await service.createDiscount(data, dbName);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async getDiscounts(key) {
        try {
            const data = await service.getActiveDiscounts(key);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }

    async deleteDiscount(discountId, dbName) {
        try {
            const result = await service.deleteDiscount(discountId, dbName);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async createBonus(data, dbName) {
        try {
            const result = await service.createBonus(data, dbName);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async getActiveBonuses(key) {
        try {
            const data = await service.getActiveBonuses(key);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }

    async getBonusesList(key) {
        try {
            const data = await service.getBonusesList(key);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }

    async passiveBonus(tarif, key) {
        try {
            const result = await service.passiveBonus(tarif, key);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async activateBonus(collection_name, deadline, key) {
        try {
            const result = await service.activateBonus(collection_name, deadline, key);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async deleteBonus(collection_name, key) {
        try {
            const data = await service.deleteBonus(collection_name, key);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }

}

module.exports = new OrderController();