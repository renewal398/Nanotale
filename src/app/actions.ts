'use server';

import { generateStoryFromThemeWordsAndLength, type GenerateStoryInput, type GenerateStoryOutput } from '@/ai/flows/generate-story-from-theme-words-and-length';
import { z } from 'zod';

const StorySchema = z.object({
  theme: z.string(),
  words: z.array(z.string()).min(1, 'Please select or enter at least one word.').max(5, 'Please use a maximum of 5 words.'),
  length: z.coerce.number(),
});

export async function generateStoryAction(data: GenerateStoryInput): Promise<{ story?: GenerateStoryOutput; error?: string }> {
  const validatedFields = StorySchema.safeParse({
    ...data,
    length: Number(data.length)
  });

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const errorMessage = error.words?.[0] ?? error.theme?.[0] ?? error.length?.[0] ?? 'Invalid data.';
    return { error: errorMessage };
  }
  
  try {
    const result = await generateStoryFromThemeWordsAndLength(validatedFields.data);
    return { story: result };
  } catch (error) {
    console.error('Story generation failed:', error);
    return { error: 'An unexpected error occurred while generating the story. Please try again later.' };
  }
}
