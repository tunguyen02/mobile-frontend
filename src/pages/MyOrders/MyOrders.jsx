import { useQuery } from "@tanstack/react-query";
import React from "react";
import { handleGetAccessToken } from "../../services/axiosJWT";
import orderService from "../../services/orderService";
import { Spin } from "antd";
import OrderCard from "../../components/OrderCard/OrderCard";

function MyOrders() {
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

    return (
        <Spin spinning={isPending}>
            <div className="font-bold text-white text-2xl text-center mt-12">Đơn hàng của tôi</div>
            <div className="px-40 py-12">
                <div className="flex flex-col gap-8">
                    {data?.orders?.map((order) => (
                        <OrderCard order={order} key={order?._id} />
                    ))}
                </div>
            </div>
        </Spin>
    );
}

export default MyOrders;
