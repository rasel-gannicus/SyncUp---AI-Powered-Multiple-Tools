import habitImg from "@/assets/img/exercise.png";
import financeImg from "@/assets/img/dollar.png";
import todoImg from "@/assets/img/man shopping.png";
import womanWithLaptop from "@/assets/img/woman with laptop.png";
import { Skeleton } from "@/Components/ui/skeleton";
import Image from "next/image";

export const HomePageLoading = () => {
  return (
    <div className=" w-full min-h-screen lg:min-h-[90vh]  flex flex-col gap-4 justify-center items-center">
      <div className="flex flex-col md:flex-row justify-center items-center flex-wrap gap-4">
        <Skeleton className="h-24 w-24  p-2 bg-slate-300 dark:bg-gray-700 flex flex-col items-center justify-center gap-2 ">
          <Image src={financeImg} alt="panda" className="w-3/5" />
          <p className="text-xs font-bold text-gray-500 text-center">
            Finance Tracker
          </p>
        </Skeleton>

        <Skeleton className="h-24 w-24  p-2 bg-green-100  flex flex-col items-center justify-center gap-2 ">
          <Image src={habitImg} alt="panda" className="w-3/4" />
          <p className="text-xs font-bold text-gray-500 text-center">
            Habit Tracker
          </p>
        </Skeleton>

        <Skeleton className="h-24 w-24  p-2 bg-blue-100  flex flex-col items-center justify-center gap-2 ">
          <Image src={todoImg} alt="panda" className="w-3/4" />
          <p className="text-xs font-bold text-gray-500 text-center">
            Todo List
          </p>
        </Skeleton>

        <Skeleton className="h-24 w-24  p-2 bg-purple-100  flex flex-col items-center justify-center gap-2 ">
          <Image src={womanWithLaptop} alt="panda" className="w-3/5" />
          <p className="text-xs font-bold text-gray-500 text-center">Notepad</p>
        </Skeleton>
      </div>
    </div>
  );
};

export const CustomLoadingSkeleton = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <div className="flex space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
};

export const HabitTrackerLoading = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full p-4 dark:bg-gray-700 " />
      <Skeleton className="h-16 w-full p-4 dark:bg-gray-700 " />
      <Skeleton className="h-16 w-full p-4 dark:bg-gray-700 " />
    </div>
  );
};

export const NotepadLoading = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-full w-full p-4 min-h-[300px] dark:bg-gray-700 " />
    </div>
  );
};

interface CustomLoadingSpinnerProps {
  borderColor?: string;
}

export const CustomLoadingSpinner = ({borderColor = 'white'} : CustomLoadingSpinnerProps ) => {
  return (
    <div className="flex justify-center items-center">
      <div 
        className="animate-spin rounded-full h-5 w-5 border-b-2"
        style={{ borderColor }}
      ></div>
    </div>
  );
};