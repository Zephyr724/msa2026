export function firstCompleteSentence(content: string, fallback: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  const complete = normalized.match(/^.*?[.!?。！？](?:["'”’」』】）)]*)/u)?.[0];
  return (complete ?? normalized) || fallback;
}
