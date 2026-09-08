import bulbAi from '@/assets/img/bulb.png';

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/Components/ui/select";
import { selectAiModel } from '@/Redux/features/PromptForAi/PromptAiSlice';
import { useAppDispatch, useAppSelector } from '@/Redux/hooks';
import Image from 'next/image';
import { aiModels } from '../../../../../../aiModels.config';


export default function SelectAiModel() {
    const selectedAiModel = useAppSelector((state) => state.promptTextAi.aiModel);
    const dispatch = useAppDispatch();
    return (
        <div>
            <Select value={selectedAiModel} onValueChange={(value) => dispatch(selectAiModel(value))}>
                <SelectTrigger className="flex justify-start items-center gap-3 shadow-sm">
                    {!selectedAiModel && <Image
                        src={bulbAi}
                        width={100}
                        height={100}
                        className='w-6 h-6'
                        alt="bulbAi"
                    />}
                    <SelectValue placeholder="Select Ai Model" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {[...aiModels]
                            .sort((a, b) => a.title.localeCompare(b.title))
                            .map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                                <div className='flex justify-start items-center gap-3'>
                                    <Image
                                        src={model.imgSource}
                                        width={100}
                                        height={100}
                                        className='w-6 h-6'
                                        alt={`${model.title.toLowerCase()}Png`}
                                    />
                                    <span>{model.title}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}