---
title: "Intentional Design - Better Lyrics"
date: "2025-09-30"
banner: "https://res.cloudinary.com/boidu/image/upload/t_banner/v1720053968/Fb31GDDUYAQCGIl_wwua8t.jpg"
labels: ['Design', 'Principles','Extension']
authors: ["cubey"]
description: >
  The core ideology powering Better Lyrics, Youtube musics' most loved extension
---

## What is Intentional Design?

Intentional design means every decision serves a purpose. Nothing is arbitrary. Nothing is added "just because." Every color, every animation, every feature exists to enhance the core experience - and if it doesn't, it's cut.

But here's the twist: intentional design doesn't mean invisible. Better Lyrics is deliberately beautiful. The aesthetics are bold. The animations are noticeable. But they're not decoration - they're functional. The beauty serves readability. The animations create rhythm. The visual polish builds trust.

When done right, intentional design feels effortless, everything makes sense. They never wonder "why is this here?" because the answer is obvious through use.

For Better Lyrics, this philosophy wasn't just a nice-to-have. It was the foundation.

If you don't know what Better Lyrics is, I'd highly recommend reading [my previous article on it](./better-lyrics)

## The Problem with "Designing for Designers"

Here's a trap I see constantly: developers and designers building products for other developers and designers. We get caught up in showing off our skills - clever interactions, elaborate animations, unconventional layouts. We forget that most users don't care about our craft. They care about their music.

When someone opens YouTube Music, they're not thinking "I wonder how the lyrics extension will wow me today." They're thinking "I want to read what this song has to say." The moment your design becomes the focus, you've failed.

## The Design Principles

### 1. Reimagine, Don't Replicate

Here's the thing: Better Lyrics doesn't look like YouTube Music. At all.

And that's intentional. Because "respecting the platform" doesn't mean copying it - it means understanding what the platform *should* be. YouTube Music's lyrics interface isn't just underwhelming, it's a missed opportunity. So instead of blending in, I asked: what would lyrics look like if YouTube Music had actually thought about this from first principles?

Better Lyrics is pretty. It's meant to be. The typography is crisp, the gradients are smooth & the animations feel premium. It doesn't look like an Apple Music clone or a Spotify knockoff - it's its own thing. Because at the end of the day, lyrics are an emotional, artistic experience. They deserve to look beautiful.

But here's where intentionality comes in: the beauty isn't the point. It's in service of readability, focus, and immersion. Every aesthetic choice exists to make reading and singing along more natural. The gradient masks guide your eye. The spacing prevents overwhelming. The sync animations create rhythm.

And because design is subjective - because everyone's idea of "beautiful" is different - Better Lyrics has themes. Users can choose what feels right to them. Some want minimal. Some want vibrant. The intentional part isn't forcing everyone into one aesthetic, it's giving them the tools to make it feel like *their* YouTube Music.

### 2. Default to Smart

Here's a controversial take: settings pages are often a sign of design failure.

Don't get me wrong - Better Lyrics has settings. But every time I add a new one, I ask myself: "Why can't I just make the right decision for the user?"

Most settings in Better Lyrics exist because different contexts genuinely need different behaviors - not because I couldn't decide what was better.

### 3. Everything Needs a Purpose

Here's a question me and other maintainers ask before adding anything to Better Lyrics: **Does this really have a purpose in Better Lyrics?**

Not "would this be cool?" Not "do other apps have this?" But does it serve the core function - helping users read and experience lyrics better?

This filter is ruthless. We've killed dozens of feature ideas that sounded great on paper but failed this test. Social sharing? Doesn't help you read lyrics. Lyric annotations? Adds complexity without improving the core experience. AI-generated song meanings? Cool, but unnecessary.

Every feature that makes it into Better Lyrics exists because it directly serves the user's primary goal. Translations? Yes - some users need to understand the lyrics. Click-to-seek? Yes - users want to jump to specific parts.

This isn't about being minimal for the sake of minimalism. It's about intentionality. When you introduce features just because you can, you dilute the experience. Every addition has a cost - cognitive load, visual clutter, maintenance burden. If it's not earning its place, it doesn't belong.

Better Lyrics does fewer things, but it does them exceptionally well. Users don't have to learn a complex interface or navigate through features they'll never use. They just get, well, better lyrics.

### 4. Performance IS Design

If your design causes jank, it doesn't matter how pretty it is. It's bad design.

Better Lyrics runs on every YouTube Music page load. If it's slow, users will notice. If it blocks rendering, users will notice. If it causes the music to stutter even for a millisecond, **users will definitely notice.**

This is why I obsess over bundle size, lazy loading, and efficient DOM manipulation. Not because I'm a performance nerd (okay, maybe a little), but because speed is invisible until it's gone. Then suddenly, it's all users can see.

Even though this sometimes means we have to reinvent the wheel, we do it. Simply because we obsess over User Experience over how easy it is to develop.

Better Lyrics could have used an extension framework. There are great ones I use for other projects. But we didn't. Frameworks add bloat, increase bundle size, and ship features you'll never use. We kept it lean instead.

### 4. Anticipate Intent

The best interfaces predict what you want to do next.

In Better Lyrics, if you click on a lyric line, you probably want to jump to that part of the song. You shouldn't need to click a "seek" button or confirm your action. Just click, and it happens.

Scroll manually and we'll pause auto-scroll - no fighting for control. A resume button appears if you want it back. Or just stop scrolling. We'll notice for a while and pick it back up for you.

These tiny decisions compound. Each one removes friction. Each one reinforces that every element was designed with purpose.

## The Features That Aren't Features

Some of the most important parts of Better Lyrics are things users will never notice:

**Error Recovery**: If RichSynced lyrics api fails, we fall back through multiple sources until we hit YouTube Music's defaults. Silent failures, no broken states. Recent versions are even slicker - we show non-synced lyrics immediately while searching in the background. A subtle indicator appears, then the lyrics just sync. Magic!

**Progressive Enhancement**: The extension loads in stages. First, the essential styling. Then, the synced lyrics. Then, translations. If something fails halfway through, you still get a working experience.

**Responsive Adaptation**: Better Lyrics detects your window size and adjusts accordingly. Not because there's a "mobile mode" toggle, but because it just does the right thing. I didn't even know mobile browsers supported extensions when I started building this. Turns out they do, and users love it.

These aren't features I can market. They don't make flashy demo videos. But they're the reason Better Lyrics feels polished.

## When Intentionality Breaks Down

Here's the thing about intentional design: when execution doesn't match intent, users feel it immediately.

Early versions of Better Lyrics had an issue where scrolling lyrics would sometimes drift out of sync by a few milliseconds. Users noticed. Immediately. Because the intent was clear - lyrics should sync perfectly - but the execution fell short. That gap between promise and reality? That's where trust erodes.

I spent days fixing that bug. It violated the core principle: if you're going to do something, do it right. In my book, half-measures aren't intentional, they're lazy.

## The Paradox

The irony of intentional design is that it takes enormous effort to create something that feels effortless.

Every detail of Better Lyrics - from the backgrounds to the exact timing of the scroll animations - was carefully considered. Adalie and me have probably spent more time on details that 99% of users will never consciously notice than on the features they explicitly asked for.

But that's the point. The sum of these intentional decisions creates an experience that just **feels right**. Users might not be able to articulate why Better Lyrics is better, they just know it is.

## Why This Matters

With over 30,000 daily active users, Better Lyrics could've gone in a lot of directions. I could've added social features, gamification, AI-powered lyrics, or any of the other trendy features.

But that would've been designing for a business, not for users.

Users don't want a lyrics extension with features. They want lyrics that don't suck. Everything else is noise.

## The Philosophy, Generalized

Intentional design isn't just for browser extensions. It's a mindset that applies to any product:

**Ask**: What is the user actually trying to accomplish?
**Design**: The shortest path to that goal.
**Remove**: Everything else.
**Question**: Does this really have a purpose here?

The best products don't feel like products. They feel like extensions of your own capabilities. Like they're reading your mind.

That's the bar.

## Closing Thoughts

When people ask me about Better Lyrics' design, I usually don't have much to say. There's no grand story about a breakthrough moment or a clever trick that changed everything.

It's just a collection of thousand small decisions, all to serve the user's needs, nothing more, nothing less.

The best compliment Better Lyrics has ever gotten wasn't "this looks so beautiful" or "the animations are pretty." It was "I don't believe Google hasn't implemented this already."

That's when I knew I got it right.
