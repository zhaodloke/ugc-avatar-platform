import { ScriptTemplate } from '@/types/project';

export const scriptTemplates: ScriptTemplate[] = [
  {
    id: 'product-announcement',
    name: 'Product Announcement',
    category: 'Marketing',
    description: 'Introduce a new product or feature',
    content: `Hey everyone! I'm super excited to share something new with you today.

We've just launched {{product_name}}, and it's going to change the way you {{benefit}}.

Here's what makes it special:
- {{feature_1}}
- {{feature_2}}
- {{feature_3}}

Ready to try it out? Click the link below to get started!`,
  },
  {
    id: 'social-intro',
    name: 'Social Media Intro',
    category: 'Social',
    description: 'Introduce yourself on social media',
    content: `Hey there! I'm {{name}}, and welcome to my channel!

If you're interested in {{topic}}, you're in the right place.

I'll be sharing tips, tricks, and insights that have helped me {{achievement}}.

Make sure to follow along so you don't miss any updates!`,
  },
  {
    id: 'testimonial',
    name: 'Customer Testimonial',
    category: 'Marketing',
    description: 'Share a customer success story',
    content: `I used to struggle with {{problem}}, and I tried everything.

Then I discovered {{product_name}}, and honestly? It changed everything.

Within {{timeframe}}, I was able to {{result}}.

If you're dealing with the same issues, I can't recommend this enough.`,
  },
  {
    id: 'educational',
    name: 'Educational Content',
    category: 'Education',
    description: 'Teach something valuable',
    content: `Today I want to teach you about {{topic}}.

This is something that most people get wrong, but once you understand it, everything changes.

Here's the key insight: {{main_point}}.

Let me break it down step by step...

First, {{step_1}}.
Then, {{step_2}}.
Finally, {{step_3}}.

And that's it! Simple, right?`,
  },
  {
    id: 'sales-pitch',
    name: 'Sales Pitch',
    category: 'Sales',
    description: 'Persuasive sales message',
    content: `Are you tired of {{pain_point}}?

What if I told you there's a better way?

{{product_name}} helps you {{benefit}} without {{common_objection}}.

Our customers have seen {{social_proof}}.

For a limited time, you can get started for just {{price}}.

Click below to claim your spot before it's gone!`,
  },
  {
    id: 'how-to',
    name: 'How-To Tutorial',
    category: 'Education',
    description: 'Step-by-step tutorial',
    content: `In this video, I'll show you exactly how to {{goal}}.

This is perfect for {{target_audience}}, and it only takes {{time_estimate}}.

Let's get started!

Step 1: {{step_1}}
Step 2: {{step_2}}
Step 3: {{step_3}}

And there you have it! You've just learned how to {{goal}}.

If you found this helpful, don't forget to share it with someone who needs it!`,
  },
  {
    id: 'announcement',
    name: 'General Announcement',
    category: 'General',
    description: 'Make an important announcement',
    content: `I have some exciting news to share with you today!

{{announcement}}

This is a big deal because {{reason}}.

Here's what this means for you: {{impact}}.

Stay tuned for more updates, and thank you for your continued support!`,
  },
  {
    id: 'call-to-action',
    name: 'Call to Action',
    category: 'Marketing',
    description: 'Drive specific action',
    content: `Quick question: Have you {{question}}?

If not, you're missing out on {{benefit}}.

Here's what I want you to do right now:

{{action}}

It takes less than {{time}}, and the results speak for themselves.

Don't wait - take action today!`,
  },
];

export function getTemplateById(id: string): ScriptTemplate | undefined {
  return scriptTemplates.find((template) => template.id === id);
}

export function getTemplatesByCategory(category: string): ScriptTemplate[] {
  return scriptTemplates.filter((template) => template.category === category);
}

export function getTemplateCategories(): string[] {
  return [...new Set(scriptTemplates.map((t) => t.category))];
}
