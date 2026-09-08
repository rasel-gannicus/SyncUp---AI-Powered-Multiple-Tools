import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { RefreshCw, Search } from 'lucide-react';
import OutPutResult from '../OutPutResult';
import SelectAiModel from './components/SelectAiModel';
import { SummerizeCardProps } from './SummerizeCard';


export default function AnalyzeCard({
    inputText,
    setInputText,
    setAction,
    textStats,
    error,
    ButtonWithIcon
}: SummerizeCardProps) {
    const handleInputText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        setAction('analyze');
    }
    return (
        <Card className="bg-white dark:bg-gray-700 shadow-lg mt-5">
            <CardHeader className=''>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">Analyze Your Writtings with AI</CardTitle>
                    {/* Select Ai model */}
                    <SelectAiModel />
                </div>

            </CardHeader>
            <CardContent className="space-y-6">
                {/* Input Section with Stats */}
                <div className="space-y-2">
                    <div className="relative">
                        <textarea
                            className="w-full h-48 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700"
                            placeholder="Enter your text here..."
                            value={inputText}
                            onChange={handleInputText}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setInputText('')}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Text Statistics */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>Characters: {textStats.characters}</span>
                        <span>Words: {textStats.words}</span>
                        <span>Sentences: {textStats.sentences}</span>
                        <span>Paragraphs: {textStats.paragraphs}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        <ButtonWithIcon action="analyze" icon={Search} label="Analyze" />
                        {/* <ButtonWithIcon action="grammar" icon={PenLine} label="Check Grammar" /> */}
                    </div>
                    <div className="flex flex-wrap gap-2"></div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Output Section */}
                <OutPutResult />
            </CardContent>
        </Card>
    );
}