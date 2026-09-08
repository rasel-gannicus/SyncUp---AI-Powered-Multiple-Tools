"use client";
import Login from "@/Components/Register & Login/Login/Login";
import Register from "@/Components/Register & Login/Register/Register";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function Page() {
    const params = useParams();
    const { slug } = params;
    const [activeTab, setActiveTab] = useState(!slug ? 'login' : (slug === 'login' ? 'login' : 'register'));

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };
    return (
        <div className="min-h-screen h-full w-full bg-white dark:bg-slate-800 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-600 rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full flex">
                {/* Left side - Login Form */}
                <div className="w-full md:w-1/2 p-8 max-h-[93vh] overflow-y-auto ">
                    <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
                        <TabsList className="grid w-full grid-cols-2 mb-8 pb-11">
                            <TabsTrigger
                                value="login"
                                className="text-xl  data-[state=active]:text-[#00A9A5]  data-[state=active]:border-[#00A9A5]"
                            >
                                Login
                            </TabsTrigger>
                            <TabsTrigger
                                value="register"
                                className="text-xl data-[state=active]:text-purple-800 "
                            >
                                Sign up
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <Login />
                        </TabsContent>

                        <TabsContent value="register">
                            <Register />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right side - Illustration container with circles */}
                <div className={`hidden md:block w-1/2 ${activeTab === 'register' ? 'bg-purple-50' : 'bg-[#E5F6F6]'
                    } dark:bg-gray-900 relative overflow-hidden`}>
                    {/* Largest circle */}
                    <div className={`absolute right-0 top-0 bottom-0 w-[90%] rounded-l-full opacity-10 ${activeTab === 'register' ? 'bg-purple-500' : 'bg-[#00A9A5]'
                        }`} />
                    {/* Medium circle */}
                    <div className={`absolute right-0 top-0 bottom-0 w-[80%] rounded-l-full opacity-20 ${activeTab === 'register' ? 'bg-purple-700' : 'bg-[#00A9A5]'
                        }`} />
                    {/* Smallest circle */}
                    <div className={`absolute right-0 top-0 bottom-0 w-[60%] rounded-l-full opacity-30 ${activeTab === 'register' ? 'bg-purple-800' : 'bg-[#00A9A5]'
                        }`} />
                    {/* Robot AI Image */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        {/* <Image
                src={loginPagePic}
                alt="Login Page Pic"
                className="w-2/3 h-auto object-contain"
              /> */}
                    </div>
                </div>
            </div>
        </div>
    );
}