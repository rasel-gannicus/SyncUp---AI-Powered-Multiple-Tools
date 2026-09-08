import { useAppSelector } from "@/Redux/hooks";
import { Button } from '@/Components/ui/button';
import { CheckCheck, Copy } from 'lucide-react';
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


export default function OutPutResult() {
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const promptState = useAppSelector((state) => state.promptTextAi);
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setError('Failed to copy text');
        }
    };

    const outputText = promptState.outputText;
    return (
        <div>
            {outputText && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Result:</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(outputText)}
                            className="flex items-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <CheckCheck className="h-4 w-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ children }) => <p className="markdown-body">{children}</p>
                            }}
                        >
                            {outputText.replace(/^\\boxed{\n?/, '').replace(/}$/, '')}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}