"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Dices, Loader2, RefreshCw, Send, Twitter, Wand2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ReactMarkdown from 'react-markdown';

import { generateStoryAction } from "@/app/actions";
import type { GenerateStoryOutput } from "@/ai/flows/generate-story-from-theme-words-and-length";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DICTIONARY, THEMES, WORD_COUNTS } from "@/lib/nanotale-data";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  theme: z.string({ required_error: "Please select a theme." }),
  length: z.string({ required_error: "Please select a word count." }),
  words: z.array(z.string()).min(1, "Please add at least one word.").max(5, "You can add up to 5 words."),
});

type FormValues = z.infer<typeof formSchema>;

const shuffle = <T,>(array: T[]): T[] => {
  return array.sort(() => 0.5 - Math.random());
};

export default function StoryGenerator() {
  const [isGenerating, startTransition] = useTransition();
  const [generatedStory, setGeneratedStory] = useState<GenerateStoryOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [customWord, setCustomWord] = useState("");
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      theme: "sci-fi",
      length: "200",
      words: [],
    },
  });

  const selectedWords = form.watch("words");

  const refreshWordOptions = () => {
    setWordOptions(shuffle(DICTIONARY).slice(0, 8));
  };

  useEffect(() => {
    const initialWords = shuffle(DICTIONARY).slice(0, 3);
    form.setValue("words", initialWords);
    refreshWordOptions();
  }, [form]);

  const toggleWordSelection = (word: string) => {
    const currentWords = form.getValues("words");
    const newWords = currentWords.includes(word)
      ? currentWords.filter((w) => w !== word)
      : [...currentWords, word];
    form.setValue("words", newWords, { shouldValidate: true });
  };
  
  const handleAddCustomWord = () => {
    const word = customWord.trim().toLowerCase();
    if (word && !selectedWords.includes(word)) {
      form.setValue("words", [...selectedWords, word], { shouldValidate: true });
    }
    setCustomWord("");
  };

  const handleRandomizeWords = () => {
    form.setValue("words", shuffle(DICTIONARY).slice(0, 3), { shouldValidate: true });
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      setGeneratedStory(null);
      const result = await generateStoryAction({
        ...data,
        length: Number(data.length),
      });

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else if (result.story) {
        setGeneratedStory(result.story);
      }
    });
  };
  
  const handleCopy = () => {
    if (!generatedStory?.story) return;
    const textToCopy = `${generatedStory.title}\n\n${generatedStory.story}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!generatedStory?.story) return;
    const storyText = `${generatedStory.title}\n\n${generatedStory.story}`;
    const tweetText = storyText.length > 250
        ? `${storyText.substring(0, 250)}... #Nanotale`
        : `${storyText} #Nanotale`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, "_blank");
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="words"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-lg">Words</FormLabel>
                    <FormDescription>Pick some words to inspire your story, or add your own.</FormDescription>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {wordOptions.map((word) => (
                        <Badge
                          key={word}
                          variant={selectedWords.includes(word) ? "default" : "secondary"}
                          onClick={() => toggleWordSelection(word)}
                          className="cursor-pointer transition-transform hover:scale-105"
                        >
                          {word}
                        </Badge>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={refreshWordOptions}><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Input
                        placeholder="Add a custom word"
                        value={customWord}
                        onChange={(e) => setCustomWord(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddCustomWord(); }}}
                      />
                      <Button type="button" onClick={handleAddCustomWord}><Send className="w-4 h-4" /></Button>
                      <Button type="button" variant="outline" onClick={handleRandomizeWords}><Dices className="w-4 h-4 mr-2" /> Random</Button>
                    </div>
                    <div className="pt-4 space-y-2">
                       {selectedWords.length > 0 && <FormLabel>Your words:</FormLabel>}
                        <div className="flex flex-wrap gap-2">
                        {selectedWords.map((word) => (
                            <Badge key={word} variant="default" className="text-base py-1 pl-3 pr-2">
                            {word}
                            <button type="button" onClick={() => toggleWordSelection(word)} className="ml-2 rounded-full hover:bg-primary-foreground/20 p-0.5">
                                <X className="w-3 h-3"/>
                            </button>
                            </Badge>
                        ))}
                        </div>
                    </div>
                     <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />

              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-lg">Theme</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          {THEMES.map((theme) => (
                             <FormItem key={theme} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={theme} />
                                </FormControl>
                                <FormLabel className="font-normal capitalize">{theme}</FormLabel>
                              </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Word Count</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select story length" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WORD_COUNTS.map((count) => (
                            <SelectItem key={count} value={String(count)}>{count} words</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                  
                    Generate Story
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {(isGenerating || generatedStory) && (
        <Card className={cn("transition-opacity duration-700", isGenerating && !generatedStory ? 'opacity-50' : 'opacity-100')}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle>{generatedStory?.title || "Your Nanotale"}</CardTitle>
                {isGenerating && !generatedStory && <CardDescription className="mt-2">Generating a title...</CardDescription>}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="icon" onClick={() => form.handleSubmit(onSubmit)()} disabled={isGenerating} aria-label="Regenerate">
                  <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")}/>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCopy} disabled={isGenerating || !generatedStory} aria-label="Copy">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                 <Button variant="ghost" size="icon" onClick={handleShare} disabled={isGenerating || !generatedStory} aria-label="Share on Twitter">
                  <Twitter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             {isGenerating && !generatedStory && (
                <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                </div>
             )}
            <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl dark:prose-invert leading-relaxed animate-in fade-in duration-1000">
              <ReactMarkdown>{generatedStory?.story || ""}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
