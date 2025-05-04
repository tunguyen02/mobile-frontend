import { Menu } from "antd";
import { Link } from "react-router-dom";
import logo from "../../assets/logo-topzone-1.png";
import { useNavigate } from "react-router-dom";

import {
    DashboardOutlined,
    ShoppingCartOutlined,
    ShoppingOutlined,
    UserOutlined,
    CarryOutOutlined,
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
                    <Link to="/admin/dashboard">Dashboard</Link>
                </Menu.Item>

                <Menu.Item key="2" icon={<CarryOutOutlined />}>
                    <Link to="/admin/brands">Brands</Link>
                </Menu.Item>

                <Menu.Item key="3" icon={<ShoppingCartOutlined />}>
                    <Link to="/admin/products">Products</Link>
                </Menu.Item>

                <Menu.Item key="4" icon={<ShoppingOutlined />}>
                    <Link to="/admin/orders">Orders</Link>
                </Menu.Item>

                <Menu.Item key="5" icon={<UserOutlined />}>
                    <Link to="/admin/users">Users</Link>
                </Menu.Item>

                <Menu.Item key="6" icon={<MessageOutlined />}>
                    <Link to="/admin/chat">Chat</Link>
                </Menu.Item>
            </Menu>
        </div>
    );
};

export default AdminSiderMenu;
