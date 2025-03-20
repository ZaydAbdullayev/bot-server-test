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

    async updateOrder(data, orderId) {
        try {
            const result = await service.updateOrder(data, orderId);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async updateFullOrder(data, orderId) {
        try {
            const result = await service.updateFullOrder(data, orderId);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async createOrUpdateEvent(type, data, orderId) {
        try {
            const result = await service.createOrUpdateEvent(type, data, orderId);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async createDiscount(data) {
        try {
            const result = await service.createDiscount(data);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async getDiscounts() {
        try {
            const data = await service.getActiveDiscounts();
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }

    async deleteDiscount(discountId) {
        try {
            const result = await service.deleteDiscount(discountId);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async createBonus(data) {
        try {
            const result = await service.createBonus(data);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async getActiveBonuses() {
        try {
            const data = await service.getActiveBonuses();
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }

    async getBonusesList() {
        try {
            const data = await service.getBonusesList();
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }

    async passiveBonus(tarif) {
        try {
            const result = await service.passiveBonus(tarif);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async activateBonus(collection_name, deadline) {
        try {
            const result = await service.activateBonus(collection_name, deadline);
            return result;
        } catch (error) {
            return { error: error.message };
        }
    }

    async deleteBonus(collection_name) {
        try {
            const data = await service.deleteBonus(collection_name);
            return data;
        } catch (error) {
            return { error: error.message };
        }
    }

}

module.exports = new OrderController();