export const isJsonString = (data) => {
    try {
        JSON.parse(data);
        return true;
    } catch (e) {
        return false;
    }
};

export const timeTranformFromMongoDB = (time) => {
    const date = new Date(time);

    const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    };
    return date.toLocaleString("vi-VN", options) + "  (GMT+7)";
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
};


export const isFlashSaleValid = (flashSaleData) => {
    if (!flashSaleData) return false;

    try {
        const now = new Date().getTime();
        const endTime = flashSaleData.endTime ? new Date(flashSaleData.endTime).getTime() : 0;
        const isTimeValid = endTime > now;

        const soldCount = flashSaleData.soldCount || 0;
        const quantity = flashSaleData.quantity || 0;
        const isQuantityAvailable = soldCount < quantity;

        return isTimeValid && isQuantityAvailable;
    } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái Flash Sale:", error);
        return false;
    }
};


export const updateFlashSaleSoldCount = (productId, quantityToAdd) => {
    try {
        const flashSaleKey = `flashSale_${productId}`;
        const flashSaleData = localStorage.getItem(flashSaleKey);

        if (!flashSaleData) return false;

        const parsedData = JSON.parse(flashSaleData);
        const currentSoldCount = parsedData.soldCount || 0;
        const totalQuantity = parsedData.quantity || 0;

        const newSoldCount = currentSoldCount + quantityToAdd;
        parsedData.soldCount = newSoldCount;

        if (newSoldCount >= totalQuantity) {
            localStorage.removeItem(flashSaleKey);
            return false;
        }

        localStorage.setItem(flashSaleKey, JSON.stringify(parsedData));

        return isFlashSaleValid(parsedData);
    } catch (error) {
        console.error(`Lỗi khi cập nhật Flash Sale soldCount cho sản phẩm ${productId}:`, error);
        return false;
    }
};
