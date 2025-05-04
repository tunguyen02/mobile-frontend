import HeaderNavbar from '../../components/HeaderNavbar/HeaderNavbar'
import Footer from '../../components/Footer/Footer'
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/userStore';
import userService from '../../services/userService';
import { handleGetAccessToken } from '../../services/axiosJWT';
import cartService from '../../services/cartService';
import { setCart } from '../../redux/cartSlice';
import ChatWidget from '../../components/Chat/ChatWidget';

function ClientPage({ children }) {
    const { pathname } = useLocation();
    const dispatch = useDispatch();

    const handleGetUserProfile = async (accessToken) => {
        try {
            const data = await userService.getUserInformation(accessToken);
            dispatch(setUser({ ...data.user, accessToken: accessToken }));
        } catch (e) {
            console.log(e.message);
        }
    };

    const handleGetUserCart = async (accessToken) => {
        try {
            const data = await cartService.getMyCart(accessToken);
            dispatch(setCart(data?.cart));
        } catch (e) {
            console.log(e.message);
        }
    }

    useEffect(() => {
        const accessToken = handleGetAccessToken();

        if (accessToken) {
            handleGetUserProfile(accessToken);
            handleGetUserCart(accessToken);
        }
    }, [pathname]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div>
            <HeaderNavbar />
            {children}
            <Footer />
            <ChatWidget />
        </div>
    )
}

export default ClientPage