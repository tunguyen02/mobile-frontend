import { Menu } from "antd";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.jpg";
import { useNavigate } from "react-router-dom";

import {
    DashboardOutlined,
    ShoppingCartOutlined,
    ShoppingOutlined,
    UserOutlined,
    CarryOutOutlined,
    ThunderboltOutlined,
    DollarOutlined,
    MessageOutlined
} from "@ant-design/icons";

const AdminSiderMenu = () => {

    const navigate = useNavigate();
    return (
        <div className="h-full text-white flex flex-col">
            <div className="p-1 flex items-center justify-center bg-neutral-950">
                <img
                    src={logo}
                    alt="Admin Logo"
                    className="h-12 w-auto cursor-pointer"
                    onClick={() => {
                        navigate("/");
                    }}
                />
            </div>

            <Menu
                theme="dark"
                mode="inline"
                className="flex-1"
                defaultSelectedKeys={["1"]}
            >
                <Menu.Item key="1" icon={<DashboardOutlined />}>
                    <Link to="/admin/dashboard">Trang chủ</Link>
                </Menu.Item>

                <Menu.Item key="2" icon={<CarryOutOutlined />}>
                    <Link to="/admin/brands">Thương hiệu</Link>
                </Menu.Item>

                <Menu.Item key="3" icon={<ShoppingCartOutlined />}>
                    <Link to="/admin/products">Sản phẩm</Link>
                </Menu.Item>

                <Menu.Item key="4" icon={<ShoppingOutlined />}>
                    <Link to="/admin/orders">Đơn hàng</Link>
                </Menu.Item>

                <Menu.Item key="5" icon={<UserOutlined />}>
                    <Link to="/admin/users">Người dùng</Link>
                </Menu.Item>

                <Menu.Item key="6" icon={<ThunderboltOutlined />}>
                    <Link to="/admin/flash-sales">Flash Sale</Link>
                </Menu.Item>

                <Menu.Item key="7" icon={<DollarOutlined />}>
                    <Link to="/admin/refunds">Quản lý hoàn tiền</Link>
                </Menu.Item>

                <Menu.Item key="8" icon={<MessageOutlined />}>
                    <Link to="/admin/chats">CSKH</Link>
                </Menu.Item>
            </Menu>
        </div>
    );
};

export default AdminSiderMenu;
