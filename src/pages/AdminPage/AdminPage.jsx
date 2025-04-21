import { Layout } from "antd";
import AdminHeaderNavbar from "../../components/HeaderNavbar/AdminHeaderNavBar";
import AdminSiderMenu from "../../components/AdminSiderMenu/AdminSiderMenu";
import "tailwindcss/tailwind.css";

const { Header, Sider, Content } = Layout;

const AdminPage = ({ children }) => {
    return (
        <Layout className="min-h-screen">
            <Sider
                width={250}
                className="bg-blue-900"
                breakpoint="lg"
                collapsedWidth="80"
            >
                <AdminSiderMenu />
            </Sider>
            <Layout>
                <Header className="bg-white shadow-md p-0">
                    <AdminHeaderNavbar />
                </Header>

                <Content className="p-6 bg-gray-100">
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminPage;
