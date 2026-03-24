import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";

export function Layout() {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith("/messages");

  return (
    <>
      <Navbar />
      <Outlet />
      {!isChatPage && <BottomNav />}
    </>
  );
}
