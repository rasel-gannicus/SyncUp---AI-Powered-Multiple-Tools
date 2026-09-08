import { CardHeader, CardTitle } from "@/Components/ui/card";
import SelectAiModel from "./SelectAiModel";

export default function Header({headerText} : {headerText: string} ) {
    return (
        <CardHeader className=''>
            <div className="md:flex-row flex flex-col gap-3 justify-between items-center">
                <CardTitle className="text-2xl text-center md:text-left font-bold text-gray-800 dark:text-gray-200 tracking-tight">{headerText}</CardTitle>
                <SelectAiModel />
            </div>

        </CardHeader>
    );
}