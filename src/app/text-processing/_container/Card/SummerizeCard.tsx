import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { BookOpen, RefreshCw } from 'lucide-react';
import OutPutResult from '../OutPutResult';
import SelectAiModel from './components/SelectAiModel';
import Header from './components/Header';

export interface SummerizeCardProps {
    inputText: string;
    setInputText: (text: string) => void;
    textStats: {
        characters: number;
        words: number;
        sentences: number;
        paragraphs: number;
    };
    error: string;
    outputText: string;
    copied: boolean;
    setCopied: (copied: boolean) => void;
    setAction?: any;
    copyToClipboard: (text: string) => void;
    ButtonWithIcon: React.FC<{
        action: string;
        icon: React.ElementType;
        label: string;
    }>;
}

export default function SummerizeCard({
    inputText,
    setInputText,
    setAction,
    textStats,
    error,
    ButtonWithIcon
}: SummerizeCardProps) {
    const handleInputText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        setAction('summarize');
    }
    return (
        <Card className="bg-white dark:bg-gray-700 shadow-lg mt-5">
            <Header headerText="Transform Your Text with AI-Powered Summarization" />
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
                        <ButtonWithIcon action="summarize" icon={BookOpen} label="Summarize" />
                    </div>
                    <div className="flex flex-wrap gap-2">                        
                    </div>
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