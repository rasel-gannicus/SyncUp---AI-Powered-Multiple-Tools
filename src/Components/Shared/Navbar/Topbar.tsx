"use client";
import { PanelLeft } from "lucide-react";
import Image from "next/image";

import {
  useAddUserToDbMutation,
  useGetUserQuery,
} from "@/Redux/features/user/userApi";
import { addUserLoading, addUserToRedux } from "@/Redux/features/user/userSlice";
import { toggleSidebar } from "@/Redux/features/Sidebar/sidebarSlice";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import profileImg from "@/assets/img/profile icon (1).png";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ThemeToggle from "@/utils/Dark mode toggle/ThemeToggle";
import { HomePageLoading } from "@/utils/Loading Spinner/Loading Skeleton/Skeleton";
import { DeleteConfirmationModal } from "@/utils/Modals/DeleteConfirmationModal";
import { NavLink } from "@/utils/Navlink/NavLink";
import { useAuthState } from "@/utils/Route Protection/useAuthState";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { IoMdKey, IoMdLogIn } from "react-icons/io";
import { LinkArray } from "./Link";
import MiniMenuCardIcon from "./MiniMenuCardIcon";

const Topbar = () => {
  const [isModal, setIsModal] = useState(false);

  const { user, loading } = useAuthState(); // get user from firebase

  const [addUserToDb] = useAddUserToDbMutation();

  // --- closing sidebar on click menu link ---
  const [open, setOpen] = useState(false);

  const { data: userFromDB, isLoading } = useGetUserQuery(
    user?.providerData[0]?.email || user?.email
  ); // get user from db

  const dispatch = useAppDispatch(); // redux dispatch
  const isSidebarOpen = useAppSelector((state) => state.sidebar?.isOpen ?? true);

  useEffect(() => {
    if (userFromDB) {
      dispatch(addUserToRedux(userFromDB));
    }
    dispatch(addUserLoading(isLoading));
  }, [userFromDB, user, isLoading]);

  const handleUser = async (user: any, provider: string) => {
    if (user) {
      try {
        const response = await addUserToDb({
          user: {
            ...user,
            name: user?.displayName || user?.providerData[0]?.displayName || "",
            email: user?.providerData[0]?.email || user?.email,
            uid: user?.uid || null,
            provider: provider,
          },
        });

        if ("error" in response) {
          throw new Error("Failed to save user data to database");
        }

        toast.success(`You are signed in`);
      } catch (error) {
        console.error("Error saving user data:", error);
        toast.error(`Error saving user data after ${provider} sign-in`);
      }
    }
  };

  useEffect(() => {
    if (user) {
      handleUser(user, user.providerData[0].providerId);
    }
  }, [user]);

  if (loading) {
    return <HomePageLoading />;
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 md:gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {/* --- Sidebar Menu for mobile view --- */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs overflow-y-auto">
          <nav className="grid gap-6 text-lg font-medium mt-20">
            <div className="md:hidden absolute top-0 left-0 m-3">
              <ThemeToggle />
            </div>
            {LinkArray.map((link) => (
              <NavLink
                key={link.hrefLink}
                href={link.hrefLink}
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground [&.active]:bg-teal-500/10 dark:[&.active]:bg-orange-500/15 [&.active]:text-teal-600 dark:[&.active]:text-orange-400 [&.active]:font-semibold"
              >
                {link.iconForSidebarMenu()}
                {link.linkTitle}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* --- Desktop Sidebar Toggle Button --- */}
      <Button
        size="icon"
        variant="outline"
        onClick={() => dispatch(toggleSidebar())}
        title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="hidden sm:inline-flex rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 border-gray-200 dark:border-gray-700"
      >
        <PanelLeft
          className={`h-5 w-5 transition-transform duration-300 ${
            !isSidebarOpen
              ? "rotate-180 text-teal-600 dark:text-orange-400"
              : "text-gray-600 dark:text-gray-300"
          }`}
        />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      {/* --- Search --- */}
      <MiniMenuCardIcon />

      {/* --- Darkmode toggle --- */}
      <div className="hidden md:block">
        <ThemeToggle />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full w-10 h-10 shadow-lg dark:bg-gray-300 "
            draggable
          >
            <Image
              src={user?.providerData[0].photoURL || profileImg}
              width={36}
              height={36}
              alt="Avatar"
              className="overflow-hidden rounded-full"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {user?.providerData[0].displayName || "My Account"}
          </DropdownMenuLabel>
          <DropdownMenuLabel>
            {user?.providerData[0]?.email || user?.email && <p className="text-xs text-gray-400 mb-5">
              {user?.providerData[0]?.email || user?.email}
            </p>}
            {LinkArray.map((link) => (
              <NavLink
                key={link.hrefLink}
                href={link.hrefLink}
                className="flex  items-center justify-start py-3 gap-3 px-4 rounded-lg text-muted-foreground transition-colors hover:text-foreground   gap-y-1 [&.active]:bg-blue-100   [&.active]:text-black"
                prefetch={true}
              >
                {link.iconForSidebarMenu()}
                {/* <Image src={link.iconForSidebarMenu} alt="ai" className="h-5 w-5" width={20} height={20} /> */}
                <span className=" text-center text-xs font-medium">
                  {link.linkTitle}
                </span>
              </NavLink>
            ))}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuSeparator />
          {!user ? (
            <DropdownMenuItem>
              <Link
                className="bg-teal-500 px-3 rounded py-2 flex justify-center items-center gap-1 text-white me-2 "
                href="/authentication/login"
              >
                <IoMdLogIn />
                Login
              </Link>
              <Link
                className="bg-rose-600 px-3 rounded py-2 flex justify-center items-center gap-1 text-white "
                href="/authentication/register"
              >
                <IoMdKey className="text-lg" />
                Register
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem>
              <Button onClick={() => setIsModal(true)} className="bg-pink-600">
                Logout
              </Button>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteConfirmationModal isModal={isModal} setIsModal={setIsModal} />
    </header>
  );
};

export default Topbar;
