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

/**
 * Kiểm tra nếu một Flash Sale còn hiệu lực và còn số lượng
 * @param {Object} flashSaleData - Dữ liệu Flash Sale từ localStorage
 * @returns {boolean} - true nếu Flash Sale còn hiệu lực và còn số lượng
 */
export const isFlashSaleValid = (flashSaleData) => {
    if (!flashSaleData) return false;

    try {
        // Kiểm tra thời gian
        const now = new Date().getTime();
        const endTime = flashSaleData.endTime ? new Date(flashSaleData.endTime).getTime() : 0;
        const isTimeValid = endTime > now;

        // Kiểm tra số lượng
        const soldCount = flashSaleData.soldCount || 0;
        const quantity = flashSaleData.quantity || 0;
        const isQuantityAvailable = soldCount < quantity;

        return isTimeValid && isQuantityAvailable;
    } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái Flash Sale:", error);
        return false;
    }
};

/**
 * Cập nhật số lượng đã bán của một Flash Sale trong localStorage
 * @param {string} productId - ID của sản phẩm
 * @param {number} quantityToAdd - Số lượng cần thêm vào soldCount
 * @returns {boolean} - true nếu cập nhật thành công và Flash Sale vẫn còn hiệu lực
 */
export const updateFlashSaleSoldCount = (productId, quantityToAdd) => {
    try {
        const flashSaleKey = `flashSale_${productId}`;
        const flashSaleData = localStorage.getItem(flashSaleKey);

        if (!flashSaleData) return false;

        const parsedData = JSON.parse(flashSaleData);
        const currentSoldCount = parsedData.soldCount || 0;
        const totalQuantity = parsedData.quantity || 0;

        // Cập nhật soldCount
        const newSoldCount = currentSoldCount + quantityToAdd;
        parsedData.soldCount = newSoldCount;

        // Kiểm tra nếu đã hết hàng
        if (newSoldCount >= totalQuantity) {
            // Hết hàng, xóa Flash Sale
            localStorage.removeItem(flashSaleKey);
            return false;
        }

        // Còn hàng, cập nhật localStorage
        localStorage.setItem(flashSaleKey, JSON.stringify(parsedData));

        // Kiểm tra tính hợp lệ sau khi cập nhật
        return isFlashSaleValid(parsedData);
    } catch (error) {
        console.error(`Lỗi khi cập nhật Flash Sale soldCount cho sản phẩm ${productId}:`, error);
        return false;
    }
};
