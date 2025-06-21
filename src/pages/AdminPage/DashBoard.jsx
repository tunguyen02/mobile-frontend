import { useEffect, useState } from "react";
import { Button, message, Spin, Card, Typography, Divider, Row, Col } from "antd";
import Chart from "react-apexcharts";
import { IoStorefront, IoPerson, IoDownloadOutline, IoCart } from "react-icons/io5";
import brandService from "../../services/brandService";
import productService from "../../services/productService";
import userService from "../../services/userService";
import exportFileService from "../../services/exportFileService";
import orderService from "../../services/orderService";

const { Title, Text } = Typography;

const Dashboard = () => {
    const [brandData, setBrandData] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [brandsRes, productsRes, usersRes, ordersRes] = await Promise.all([
                    brandService.getBrandsWithProductCount(),
                    productService.countTotalProducts(),
                    userService.countTotalUsers(),
                    orderService.countOrders()
                ]);

                const brands = brandsRes.data;
                const totalProductCount = productsRes.data;
                const totalUserCount = usersRes.totalUsers;
                const totalOrderCount = ordersRes;


                const formattedBrandData = brands.map((brand) => ({
                    name: brand.name,
                    count: brand.productCount,
                }));

                setBrandData(formattedBrandData);
                setTotalProducts(totalProductCount);
                setTotalUsers(totalUserCount);
                setTotalOrders(totalOrderCount.count);


            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("Failed to fetch data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const chartOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            fontFamily: 'inherit',
        },
        xaxis: {
            categories: brandData.map((brand) => brand.name),
            labels: {
                style: {
                    colors: '#666',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#666',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                }
            }
        },
        colors: ["#4299E1"],
        dataLabels: { enabled: false },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '60%',
            }
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 4,
        },
        tooltip: {
            theme: 'light',
            y: {
                formatter: function (val) {
                    return val + " sản phẩm";
                }
            }
        }
    };

    const chartSeries = [
        {
            name: "Số lượng sản phẩm",
            data: brandData.map((brand) => brand.count),
        },
    ];

    if (error) {
        return (
            <Card className="shadow-md p-8 text-center">
                <Text type="danger" className="text-lg">{error}</Text>
            </Card>
        );
    }

    const handleExportCSV = async () => {
        try {
            const blob = await exportFileService.exportReport();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "report-phone.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error exporting file:", error);
            message.error("Không thể xuất báo cáo. Vui lòng thử lại.");
        }
    };


    return (
        <Card className="shadow-md">
            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <Spin size="large" tip="Đang tải dữ liệu..." />
                </div>
            ) : (
                <>
                    <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                            <Title level={4} className="mb-1">Tổng quan hệ thống</Title>
                            <Text type="secondary">Thống kê số liệu của cửa hàng</Text>
                        </div>
                        <Button
                            type="primary"
                            icon={<IoDownloadOutline size={16} className="mr-1" />}
                            onClick={handleExportCSV}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Xuất báo cáo
                        </Button>
                    </div>

                    <Divider className="my-4" />

                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={24} sm={12} lg={8}>
                            <Card
                                className="h-full transition-all hover:shadow-md"
                                style={{ backgroundColor: "rgba(66, 153, 225, 0.1)" }}
                                bodyStyle={{ padding: '16px' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-blue-500 text-white">
                                        <IoStorefront size={28} />
                                    </div>
                                    <div>
                                        <Text className="text-gray-500 block">Sản phẩm</Text>
                                        <Title level={3} className="m-0 text-blue-500">{totalProducts}</Title>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} lg={8}>
                            <Card
                                className="h-full transition-all hover:shadow-md"
                                style={{ backgroundColor: "rgba(72, 187, 120, 0.1)" }}
                                bodyStyle={{ padding: '16px' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-green-500 text-white">
                                        <IoPerson size={28} />
                                    </div>
                                    <div>
                                        <Text className="text-gray-500 block">Người dùng</Text>
                                        <Title level={3} className="m-0 text-green-500">{totalUsers}</Title>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} lg={8}>
                            <Card
                                className="h-full transition-all hover:shadow-md"
                                style={{ backgroundColor: "rgba(237, 137, 54, 0.1)" }}
                                bodyStyle={{ padding: '16px' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-orange-500 text-white">
                                        <IoCart size={28} />
                                    </div>
                                    <div>
                                        <Text className="text-gray-500 block">Đơn hàng</Text>
                                        <Title level={3} className="m-0 text-orange-500">{totalOrders}</Title>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    <Card
                        title={<Title level={5} className="mb-0">Số lượng sản phẩm theo thương hiệu</Title>}
                        className="shadow-sm"
                        bodyStyle={{ padding: brandData.length > 0 ? '24px 8px' : '24px' }}
                    >
                        {brandData.length > 0 ? (
                            <Chart
                                options={chartOptions}
                                series={chartSeries}
                                type="bar"
                                height={320}
                            />
                        ) : (
                            <div className="text-center py-8">
                                <Text type="secondary">Không có dữ liệu thống kê</Text>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </Card>
    );
};

export default Dashboard;
