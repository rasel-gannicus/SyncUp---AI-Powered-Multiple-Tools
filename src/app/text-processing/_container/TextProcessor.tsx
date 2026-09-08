import { Button } from '@/Components/ui/button';
import { useAppDispatch, useAppSelector } from '@/Redux/hooks';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGeminiAi } from './AI_Api_calling/useGeminiAi';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/Components/ui/tabs";
import { useOpenRouterApi } from './AI_Api_calling/useOpenRouterApi';
import AnalyzeCard from './Card/AnalyzeCard';
import CheckGrammerCard from './Card/CheckGrammerCard';
import RephraseCard from './Card/RephraseCard';
import SummerizeCard from './Card/SummerizeCard';

const TextProcessor = () => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [textStats, setTextStats] = useState({ characters: 0, words: 0, sentences: 0, paragraphs: 0 });
  const [copied, setCopied] = useState(false);
  const [action, setAction] = useState('');
  const { processWithGemini } = useGeminiAi();
  const { processWithOpenRouter } = useOpenRouterApi();

  const dispatch = useAppDispatch();
  const promptState = useAppSelector((state) => state.promptTextAi);
  const isProcessing = promptState.isProcessing;
  const outputText = promptState.outputText;

  useEffect(() => {
    updateTextStats(inputText);
  }, [inputText, action, setAction, dispatch, promptState]);


  const updateTextStats = (text: string) => {
    const characters = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(Boolean).length;
    const paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(Boolean).length;
    setTextStats({ characters, words, sentences, paragraphs });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy text');
    }
  };


  // Separate API call logic
  const handleApiCall = async () => {
    try {
      const systemPrompt = "You are a highly skilled AI assistant specializing in text processing and analysis. Provide clear, concise, and accurate responses.";
      let finalPromptText : string ;

      switch (action) {
        case 'summarize':
          finalPromptText =  `${systemPrompt}\nPlease provide a concise summary of the following text:\n\n${inputText}`;
          break;

        case 'rephrase':
          finalPromptText =   `${systemPrompt}\nPlease rephrase the following text in a different way while maintaining its meaning:\n\n${inputText}`;
          break;

        case 'analyze':
          finalPromptText =  `${systemPrompt}\nPlease analyze the following text, including its tone, style, main themes, and key points:\n\n${inputText}`;
          break;

          case 'grammar':
          finalPromptText =   `${systemPrompt}\nPlease check the grammar and style of the following text, pointing out any errors or suggestions for improvement:\n\n${inputText}`;
          break;

        case 'keywords':
          finalPromptText =   `${systemPrompt}\nPlease extract the main keywords and key phrases from the following text:\n\n${inputText}`;
          break;

        case 'simplify':
          finalPromptText =   `${systemPrompt}\nPlease simplify the following text to make it easier to understand while maintaining its core meaning:\n\n${inputText}`;
          break;

        case 'translate':
          finalPromptText =   `${systemPrompt}\nPlease translate the following text to English (if it's not already in English) and improve its clarity:\n\n${inputText}`;
          break;

        case 'expand':
          finalPromptText =  `${systemPrompt}\nPlease expand on the following text by adding more details, examples, and explanations:\n\n${inputText}`;
          break;

        default:
          finalPromptText =  `No prompt has been given`;
      }
      // await processWithGemini();
      await processWithOpenRouter(finalPromptText);

    } catch (err: any) {
      setError(err.message || 'Failed to process text');
    }
  };

  const ButtonWithIcon = ({ action, icon: Icon, label }: { action: string, icon: any, label: string }) => {
    setAction(action);
    return (<Button
      onClick={handleApiCall}
      disabled={!inputText || isProcessing}
      className="flex w-full md:w-fit items-center gap-2 bg-teal-600 dark:bg-teal-500 dark:text-black"
    >
      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </Button>)
  }

  const [activeTab, setActiveTab] = useState("summerize");

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="">
        {/* Select for mobile and small devices */}
        <div className="md:hidden w-full mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summerize">Summerize</SelectItem>
              <SelectItem value="rephrase">Rephrase</SelectItem>
              <SelectItem value="analyze">Analyze</SelectItem>
              <SelectItem value="grammer">Check Grammer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* TabsList for medium and larger devices */}
        <TabsList className="hidden md:grid w-full grid-cols-4 bg-gray-300">
          <TabsTrigger value="summerize">Summerize</TabsTrigger>
          <TabsTrigger value="rephrase">Rephrase</TabsTrigger>
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="grammer">Check Grammer</TabsTrigger>
        </TabsList>

        {/* Rest of your TabsContent remains the same */}
        <TabsContent value="summerize">
          <SummerizeCard
            inputText={inputText}
            setInputText={setInputText}
            setAction={setAction}
            textStats={textStats}
            error={error}
            outputText={outputText}
            copied={copied}
            setCopied={setCopied}
            copyToClipboard={copyToClipboard}
            ButtonWithIcon={ButtonWithIcon}
          />
        </TabsContent>
        <TabsContent value="rephrase">
          <RephraseCard
            inputText={inputText}
            setInputText={setInputText}
            setAction={setAction}
            textStats={textStats}
            error={error}
            outputText={outputText}
            copied={copied}
            setCopied={setCopied}
            copyToClipboard={copyToClipboard}
            ButtonWithIcon={ButtonWithIcon}
          />
        </TabsContent>
        <TabsContent value="analyze">
          <AnalyzeCard
            inputText={inputText}
            setInputText={setInputText}
            setAction={setAction}
            textStats={textStats}
            error={error}
            outputText={outputText}
            copied={copied}
            setCopied={setCopied}
            copyToClipboard={copyToClipboard}
            ButtonWithIcon={ButtonWithIcon}
          />
        </TabsContent>
        <TabsContent value="grammer">
          <CheckGrammerCard
            inputText={inputText}
            setInputText={setInputText}
            setAction={setAction}
            textStats={textStats}
            error={error}
            outputText={outputText}
            copied={copied}
            setCopied={setCopied}
            copyToClipboard={copyToClipboard}
            ButtonWithIcon={ButtonWithIcon}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TextProcessor;



