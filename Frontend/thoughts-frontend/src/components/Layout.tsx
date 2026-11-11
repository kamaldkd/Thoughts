import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";

export function Layout() {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith("/messages");
  const isConversationPage = location.pathname.startsWith("/messages/");

  return (
    <>
      {!isChatPage && <Navbar />}
      {<Outlet />}
      {!isConversationPage && <BottomNav />}
    </>
  );
}
