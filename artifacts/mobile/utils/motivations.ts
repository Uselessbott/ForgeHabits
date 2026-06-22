export const MOTIVATIONAL_QUOTES = [
  'You can do it.',
  'Keep moving forward.',
  'One more day.',
  'Stay consistent.',
  'Discipline over motivation.',
  'Small actions compound.',
  'Build yourself daily.',
  'The best time to start was yesterday. The second best time is now.',
  'Every day is a new opportunity.',
  'Progress, not perfection.',
  'Hard work beats talent when talent doesn\'t work hard.',
  'Your habits define your future.',
  'One percent better every day.',
  'Champions are built when no one\'s watching.',
  'Pain is temporary. Giving up lasts forever.',
  'The secret is to start.',
  'Push through the resistance.',
  'Forge yourself daily.',
  'Today\'s choices are tomorrow\'s results.',
  'Be harder to stop than to start.',
  'Consistency is the foundation of mastery.',
  'Show up. Every single day.',
  'The grind never stops.',
  'Earn it.',
  'You are what you repeatedly do.',
];

export function getDailyQuote(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const prefix = name ? `${name}, ` : '';
  if (hour < 12) return `${prefix}good morning.`;
  if (hour < 17) return `${prefix}good afternoon.`;
  return `${prefix}good evening.`;
}

export function getMotivationalGreeting(name: string, remaining: number, streak: number): string {
  const n = name || 'Champion';
  if (remaining === 0) return `${n}, all done today. 🎯`;
  if (streak > 7) return `${n}, keep the streak alive. 🔥`;
  if (remaining === 1) return `${n}, one task left.`;
  return `${n}, ${remaining} tasks remain.`;
}
