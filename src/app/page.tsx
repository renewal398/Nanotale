import StoryGenerator from "@/components/story-generator";

export default function Home() {
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
            Nanotale
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Craft big stories from small words.
          </p>
        </header>
        <StoryGenerator />
      </div>
    </main>
  );
}
