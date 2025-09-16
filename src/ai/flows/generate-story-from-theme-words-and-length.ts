'use server';

/**
 * @fileOverview Generates a story based on a theme, a list of words, and a desired length.
 *
 * - generateStoryFromThemeWordsAndLength - A function that generates a story based on the input.
 * - GenerateStoryInput - The input type for the generateStory function.
 * - GenerateStoryOutput - The return type for the generateStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStoryInputSchema = z.object({
  theme: z.string().describe('The theme of the story.'),
  words: z.array(z.string()).describe('A list of words to include in the story.'),
  length: z.number().describe('The desired length of the story in words.'),
});

export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  title: z.string().describe('An appropriate, human-like title for the generated story.'),
  story: z.string().describe('The generated story.'),
});

export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStoryFromThemeWordsAndLength(
  input: GenerateStoryInput
): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `You are a master storyteller with a gift for creating evocative and emotionally resonant narratives. Write a story with the following properties, and give it an appropriate, human-like title.

*   **Theme:** {{{theme}}}
*   **Must-Include Words:** {{#each words}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
*   **Approximate Length:** {{{length}}} words.

Your story should feel like it was written by a human, with a natural flow and a strong emotional core. Use literary techniques like metaphor, sensory details, and a distinct narrative voice. Avoid clichés and formulaic structures.`,
});

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No output from prompt');
    }
    return output;
  }
);
