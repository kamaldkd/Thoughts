import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";

export function Layout() {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith("/messages");
  const isConversationPage = location.pathname.startsWith("/messages/");
  const isEditPage = location.pathname.startsWith("/edit-profile");
  const isThoughtDetailPage = location.pathname.startsWith("/thought/");
  const isUserProfilePage = location.pathname.startsWith("/profile/");

  return (
    <>
      {!isChatPage &&
        !isEditPage &&
        !isThoughtDetailPage &&
        !isUserProfilePage && <Navbar />}
      {<Outlet />}
      {!isConversationPage && !isEditPage && !isThoughtDetailPage && <BottomNav />}
    </>
  );
}
