import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";

export function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <BottomNav />
    </>
  );
}
