import AccountMenu from "./AccountMenu";

function AdminHeaderNavbar() {

    return (
        <div className="flex justify-center bg-neutral-950 h-14">
            <div className="w-10/12 h-full flex justify-end">
                <AccountMenu />
            </div>
        </div>
    );
}

export default AdminHeaderNavbar;
