import React from "react";
import logo from "../../assets/logo-topzone-1.png";
import { Input } from "antd";
const { Search } = Input;
import { createSearchParams, useNavigate } from "react-router-dom";
import AccountMenu from "./AccountMenu";

function HeaderNavbar() {
    const navigate = useNavigate();

    const onSearch = (value, _e, info) => {
        navigate({
            pathname: "/products",
            search: createSearchParams({
                search: value,
            }).toString(),
        });
    };

    return (
        <div className="flex justify-center bg-neutral-950 h-14">
            <div className="w-10/12 h-full flex items-center justify-between">
                <div className="flex justify-center items-center h-full py-1">
                    <img
                        src={logo}
                        alt=""
                        className="h-full cursor-pointer"
                        onClick={() => {
                            navigate("/");
                        }}
                    />
                </div>
                <div className="flex justify-center w-fit content-center">
                    <Search
                        placeholder="Nhập từ khóa tìm kiếm"
                        enterButton="Search"
                        size="large"
                        onSearch={onSearch}
                        style={{ width: "400px" }}
                    />
                </div>
                <AccountMenu />
            </div>
        </div>
    );
}

export default HeaderNavbar;
