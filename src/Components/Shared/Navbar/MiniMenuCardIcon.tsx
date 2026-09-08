import habitImg from "@/assets/img/exercise.png";
import financeImg from "@/assets/img/coin bag.png";
import todoImg from "@/assets/img/man shopping.png";
import womanWithLaptop from "@/assets/img/woman with laptop.png";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/Components/ui/tooltip";
import Link from "next/link";

export const MiniMenuCardIcon = () => {
  return (
    <div className="relative ml-auto md:grow-0 flex max-w-full overflow-x-auto ">
      <TooltipProvider delayDuration={200} >
        <div className=" w-full flex justify-center items-center  gap-4  ">
          <Tooltip>
            <TooltipTrigger>
              <Link href="/finance-tracker" className="h-10 w-10 rounded md:ms-0  bg-gray-200  flex flex-col items-center justify-center gap-2 ">
                <Image src={financeImg} alt="panda" className="w-3/4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent  className="bg-slate-700 text-white">
              <p>Finance Tracker</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Link href="/habit-tracker" className="h-10 w-10 rounded   bg-gray-200  flex flex-col items-center justify-center gap-2 ">
                <Image src={habitImg} alt="panda" className="w-3/4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent  className="bg-slate-700 text-white">
              <p>Habit Tracker</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Link href="/todoList" className="h-10 w-10 rounded   bg-gray-200  flex flex-col items-center justify-center gap-2 ">
                <Image src={todoImg} alt="panda" className="w-3/4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent  className="bg-slate-700 text-white">
              <p>Todo List</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Link href="/notepad" className="h-10 w-10 rounded   bg-gray-200  flex flex-col items-center justify-center gap-2 ">
                <Image src={womanWithLaptop} alt="panda" className="w-3/5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent  className="bg-slate-700 text-white">
              <p>Notepad</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default MiniMenuCardIcon;
