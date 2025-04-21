import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoute = ({ children }) => {

    const user = useSelector((state) => state.user);
    console.log(user);

    const isAuthenticated = !!user.accessToken;
    const isAdmin = user.role === "Admin";

    setTimeout(() => {
        if (!isAuthenticated || !isAdmin) {
            return <Navigate to="/sign-in" replace />;
        }
    }, 3000);
    return children;
};

export default PrivateRoute;
