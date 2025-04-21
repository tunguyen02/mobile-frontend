import { Link } from 'react-router-dom';
import logo from '../../assets/logo-topzone-1.png';

const Footer = () => {
    return (
        <footer className="bg-black text-white py-8 px-14">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-start px-6">
                <div className="mb-6 md:mb-0 text-center md:text-left flex flex-col items-center md:items-start">
                    <Link to='/'>
                        <img src={logo} alt="TopZone Logo" className="w-32 mb-4" />
                    </Link>
                    <p className="text-gray-300">
                        TopZone - Sản phẩm điện tử uy tín, chất lượng.
                    </p>
                </div>

                <div className="mb-6 md:mb-0 text-center md:text-left">
                    <h2 className="text-lg font-semibold mb-4">Hỗ trợ khách hàng</h2>
                    <ul className="space-y-2">
                        <li>
                            <Link to="tel:1900969642" className="hover:text-gray-300">
                                Mua hàng: 1900.9696.42 (8:00 - 21:30)
                            </Link>
                        </li>
                        <li>
                            <Link to="tel:1900986843" className="hover:text-gray-300">
                                Khiếu nại: 1900.9868.43 (8:00 - 21:30)
                            </Link>
                        </li>
                        <li>
                            <Link to="/contact" className="hover:text-gray-300">
                                Kết nối với chúng tôi
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="text-center md:text-left">
                    <h2 className="text-lg font-semibold mb-4">Chính sách</h2>
                    <ul className="space-y-2">
                        <li>
                            <Link to="/terms" className="hover:text-gray-300">
                                Chính sách mua hàng online
                            </Link>
                        </li>
                        <li>
                            <Link to="/return-policy" className="hover:text-gray-300">
                                Chính sách bảo hành & đổi trả
                            </Link>
                        </li>
                        <li>
                            <Link to="/shipping" className="hover:text-gray-300">
                                Chính sách giao hàng
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="text-center mt-6 text-gray-400">
                &copy; 2025 TuNguyen. Tất cả quyền được bảo lưu.
            </div>
        </footer>
    );
};

export default Footer;
