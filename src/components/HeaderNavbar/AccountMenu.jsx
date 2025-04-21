import { Avatar, Dropdown, message, Badge, Button } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
    UserOutlined,
    ShoppingCartOutlined,
    LogoutOutlined,
    InfoCircleOutlined,
    SettingOutlined,
    LockOutlined,
} from "@ant-design/icons";
import { resetUser } from "../../redux/userStore";
import userService from "../../services/userService";
import { resetCart } from "../../redux/cartSlice";

function AccountMenu() {
    const user = useSelector((state) => state.user);
    const cart = useSelector((state) => state.cart); // Lấy giỏ hàng từ Redux store
    const cartCount = cart?.products?.length || 0; // Số lượng sản phẩm trong giỏ hàng
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Xử lý đăng xuất
    const handleLogout = async () => {
        try {
            await userService.signOut(); // Gọi API đăng xuất
            localStorage.removeItem("access_token"); // Xóa token khỏi localStorage
            dispatch(resetUser()); // Reset thông tin người dùng trong Redux
            dispatch(resetCart());
            message.success("Đăng xuất thành công", 3);
            navigate("/"); // Chuyển hướng về trang chủ
        } catch (e) {
            message.error("Đăng xuất thất bại", 3);
        }
    };

    const userMenu = [
        {
            key: "1",
            label: (
                <span
                    className="flex items-center font-bold text-black text-lg py-3 px-3 space-x-2"
                    onClick={(e) => {
                        navigate("/user/profile");
                    }}
                >
                    <InfoCircleOutlined className="text-blue-500 text-xl" />
                    <span>Thông tin tài khoản</span>
                </span>
            ),
        },
        {
            key: "2",
            label: (
                <span
                    className="flex items-center font-bold text-black text-lg py-3 px-3 space-x-2"
                    onClick={() => navigate("/my-orders")}
                >
                    <ShoppingCartOutlined className="text-green-500 text-xl" />
                    <span>Đơn hàng của tôi</span>
                </span>
            ),
        },
        {
            key: "change-password",
            label: (
                <span
                    className="flex items-center font-bold text-black text-lg py-3 px-3 space-x-2"
                    onClick={() => navigate("/user/change-password")}
                >
                    <LockOutlined className="text-purple-500 text-xl" />
                    <span>Đổi mật khẩu</span>
                </span>
            ),
        },
        ...(user.role === "Admin"
            ? [
                {
                    key: "3",
                    label: (
                        <span
                            className="flex items-center font-bold text-black text-lg py-3 px-3 space-x-2"
                            onClick={() => navigate("/admin/dashboard")}
                        >
                            <SettingOutlined className="text-orange-500 text-xl" />
                            <span>Quản lý hệ thống</span>
                        </span>
                    ),
                },
            ]
            : []),
        {
            key: "4",
            label: (
                <span
                    className="flex items-center font-bold text-black text-lg py-3 px-3 space-x-2"
                    onClick={handleLogout}
                >
                    <LogoutOutlined className="text-red-500 text-xl" />
                    <span>Đăng xuất</span>
                </span>
            ),
        },
    ];

    return (
        <div className="h-full flex items-center cursor-pointer">
            {user?.accessToken ? (
                <div className="flex gap-5">
                    <Badge
                        count={cartCount}
                        overflowCount={99}
                        showZero
                        className="flex items-center"
                    >
                        <Button
                            type="text"
                            shape="circle"
                            className="bg-gray-600 hover:!bg-gray-100 text-white"
                            icon={<ShoppingCartOutlined className="text-lg" />}
                            onClick={() => navigate("/cart")}
                        />
                    </Badge>
                    <Dropdown
                        menu={{
                            items: userMenu,
                        }}
                        placement="bottomRight"
                    >
                        {user?.avatarUrl ? (
                            <Avatar src={<img src={user?.avatarUrl} alt="avatar" />} />
                        ) : (
                            <Avatar
                                style={{
                                    backgroundColor: "#1677FF",
                                }}
                                icon={<UserOutlined />}
                            />
                        )}
                    </Dropdown>
                </div>
            ) : (
                <div className="flex h-full">
                    <Link
                        className="flex items-center justify-center hover:bg-zinc-800 w-28 h-full text-center font-bold"
                        to="/sign-in"
                    >
                        Đăng nhập
                    </Link>
                    <Link
                        className="flex items-center justify-center hover:bg-zinc-800 w-28 h-full text-center font-bold"
                        to="/sign-up"
                    >
                        Đăng ký
                    </Link>
                </div>
            )}
        </div>
    );
}

export default AccountMenu;
