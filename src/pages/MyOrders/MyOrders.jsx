import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { handleGetAccessToken } from "../../services/axiosJWT";
import orderService from "../../services/orderService";
import { Spin, Tabs, Empty } from "antd";
import OrderCard from "../../components/OrderCard/OrderCard";

function MyOrders() {
    const [activeTab, setActiveTab] = useState("all");

    const { data, isPending } = useQuery({
        queryKey: ["my-orders"],
        queryFn: async () => {
            const accessToken = handleGetAccessToken();
            return orderService.getMyOrders(accessToken);
        },
        enabled: true,
        keepPreviousData: true,
        retry: 3,
        refetchOnWindowFocus: false,
    });

    // Lọc đơn hàng theo trạng thái
    const filterOrdersByStatus = (status) => {
        if (!data?.orders || !data.orders.length) return [];
        if (status === "all") return data.orders;
        return data.orders.filter(order => order.shippingStatus === status);
    };

    const tabItems = [
        {
            key: "all",
            label: "Tất cả",
            children: (
                <div className="flex flex-col gap-10 mt-4 p-2">
                    {filterOrdersByStatus("all").length > 0 ? (
                        filterOrdersByStatus("all").map((order) => (
                            <OrderCard order={order} key={order?._id} />
                        ))
                    ) : (
                        <Empty description="Không có đơn hàng nào" />
                    )}
                </div>
            )
        },
        {
            key: "Pending",
            label: "Chờ xử lý",
            children: (
                <div className="flex flex-col gap-10 mt-4 p-2">
                    {filterOrdersByStatus("Pending").length > 0 ? (
                        filterOrdersByStatus("Pending").map((order) => (
                            <OrderCard order={order} key={order?._id} />
                        ))
                    ) : (
                        <Empty description="Không có đơn hàng nào đang chờ xử lý" />
                    )}
                </div>
            )
        },
        {
            key: "Processing",
            label: "Đang xử lý",
            children: (
                <div className="flex flex-col gap-10 mt-4 p-2">
                    {filterOrdersByStatus("Processing").length > 0 ? (
                        filterOrdersByStatus("Processing").map((order) => (
                            <OrderCard order={order} key={order?._id} />
                        ))
                    ) : (
                        <Empty description="Không có đơn hàng nào đang xử lý" />
                    )}
                </div>
            )
        },
        {
            key: "Shipping",
            label: "Đang giao hàng",
            children: (
                <div className="flex flex-col gap-10 mt-4 p-2">
                    {filterOrdersByStatus("Shipping").length > 0 ? (
                        filterOrdersByStatus("Shipping").map((order) => (
                            <OrderCard order={order} key={order?._id} />
                        ))
                    ) : (
                        <Empty description="Không có đơn hàng nào đang giao" />
                    )}
                </div>
            )
        },
        {
            key: "Completed",
            label: "Đã giao",
            children: (
                <div className="flex flex-col gap-10 mt-4 p-2">
                    {filterOrdersByStatus("Completed").length > 0 ? (
                        filterOrdersByStatus("Completed").map((order) => (
                            <OrderCard order={order} key={order?._id} />
                        ))
                    ) : (
                        <Empty description="Không có đơn hàng nào đã giao" />
                    )}
                </div>
            )
        },
        {
            key: "Cancelled",
            label: "Đã hủy",
            children: (
                <div className="flex flex-col gap-10 mt-4 p-2">
                    {filterOrdersByStatus("Cancelled").length > 0 ? (
                        filterOrdersByStatus("Cancelled").map((order) => (
                            <OrderCard order={order} key={order?._id} />
                        ))
                    ) : (
                        <Empty description="Không có đơn hàng nào đã hủy" />
                    )}
                </div>
            )
        }
    ];

    return (
        <Spin spinning={isPending}>
            <div className="font-bold text-white text-2xl text-center mt-12">Đơn hàng của tôi</div>
            <div className="px-40 py-8">
                <Tabs
                    defaultActiveKey="all"
                    items={tabItems}
                    onChange={setActiveTab}
                    type="card"
                    className="bg-white rounded-lg p-4"
                    size="large"
                />
            </div>
        </Spin>
    );
}

export default MyOrders;
