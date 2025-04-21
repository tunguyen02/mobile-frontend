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
