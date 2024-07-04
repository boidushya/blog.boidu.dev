---
title: "Next.js and its Paradigm Shift"
date: "2024-07-04"
banner: "https://res.cloudinary.com/boidu/image/upload/t_banner/v1720053968/Fb31GDDUYAQCGIl_wwua8t.jpg"
labels: ['Tutorial', 'Next.js', 'React']
description: >
  Next.js is excellent for building websites with a ton of complexities - and the best part? You can do all that with your existing React knowledge! Right? Nah, not really..
---

## Preface & a bit of history

Let me get started by saying this - Next.js is great. The first time I used Next.js was back in 2021 and from the looks
of it - it was v10.0.6. I was pretty late to the party already. I'd heard about it before but I never really _needed_
it. I was doing just fine with React. For this project specifically, I was interning at a company and they needed a newsletter.

I'd built multiple websites for them before using React and the company was pretty happy with the results.
We had a dedicated backend team and I was on cloud nine with React. But this time, things were a bit different.

They wanted this thing shipped _FAST_, like "Pretty please with a cherry on top, get this thing done TODAY Boidu" fast.
And me being the eager intern that I was, I said "Sure, I'll get it done by the end of the day".
I, infact, did NOT get it done by the end of the day. Why? Because I thought to myself,
"Hey, there's this thing called Next.js and looks like it has api routes built in. AND IT'S LITERALLY REACT!
Oh man, this is going to be a piece of cake". My intern naivety was at its peak. I was so wrong. I was so, so wrong.

![Earliest commit I could find with Next.js](https://i.ibb.co/7ym2XW5/image.png)
_Earliest commit I could find with Next.js_

## A quick rant about react-router-dom

Imagine this, you're building a React app and you need to add a new page. What do you do? You create a new component,
`<insert package manager here> install react-router-dom`, search online for a tutorial on how to use `react-router-dom`,
add a `Route` component, and you're - Oh hang on, you used `react-router-dom v5`? Tch see, what you _should've_ done is
use `react-router-dom v6`. Tough luck buddy, have fun refactoring everything you wrote and **GOOD LUCK** finding the new
docs. Mind you this is 2021, I have no clue how it is in 2024 as it's been quite a long time since I've used that
godforsaken library.

That's also the reason I've never even considered Remix (it's made by the same team that
made `react-router-dom`). I'm sure it's great but I'm not going to touch it with a 10-foot pole.
Okay I'm getting off track here. Let's get back to the topic at hand. Next.js.

## The page directory

Okay so what's the big deal with Next.js? It's just React with some extra features, right? Well, yes and no.
Yes, it is React with some extra features but the way you structure your app is completely different. One of the major
"nice-to-haves" is, Instead of having to configure your own routing system, Next.js does it for you. You just create a
file in the `pages` directory and boom, you have a new route (before you get all amped up, this is Next ~10 I'm talking
about, I'm coming to app router in a bit).

Back then, this was a game-changer for me. I didn't have to worry
about setting up a router, I could just focus on building the app. But that's not the only thing that's different.
Next.js had a completely different way of handling data fetching. You have `getStaticProps`, `getServerSideProps`,
`getStaticPaths`, and `getServerSideProps`. I'm not going to go into the details of each of these functions but the
gist of it is, you can fetch data at build time, at request time, or even generate static pages with dynamic routes.

This was a bit overwhelming for me at first. I was so used to fetching data in the `useEffect` hook that, to be quite
frank, I just kept doing that for a while. It wasn't until I started working on a project that required me to fetch
data at build time (funnily enough, this was yet another newsletter that I was building for my University) that I
actually started using these functions. But all this was just the tip of the iceberg. SSR, SSG, ISR, API routes,
file-based routing, and so much more. It was a lot to take in. I'm quite dumb, so it took me a while to get used to all
of it.

Now, let's get to the app router.

## The fancy pants app router

Next.js v13.4 (I believe) introduced a new way of routing your app. I remember seeing
like a million tweets about it. In their defense, it was pretty cool. You could now break down your routes into layout,
page, error components and have basically a plug-and-play like architecture. Pretty neat huh? But here's the thing,
the initial reception from the community was mixed. Some people loved it, some people hated it. I personally kinda liked
it.

So the gist of it is, you have a file called `layout.tsx` at the root level of your `app` directory - and this sets
the blueprint of your app. Inside this you could "structure" your app. Next, you could have a `page.tsx` and `loading.tsx`
and so on and so forth. You can check out the exhaustive list [here](https://nextjs.org/docs/getting-started/project-structure#routing-files)

![Top level folders](https://nextjs.org/_next/image?url=%2Fdocs%2Fdark%2Fterminology-component-tree.png&w=3840&q=75)
_Top level folders - [Next.js Docs](https://nextjs.org/docs/getting-started/project-structure)_

This was a bit of a significant transition for me. I was so used to having a `pages` directory and just creating files
in there. Moreover, before this, since I was rawdogging React, I had a `components` directory where I'd put all my
components and call it a day. But now, I had to think about the structure of my app. I had to think about how I wanted
to break down my app into different sections. It was pretty cool but looking back, I can see why so many people had their
pitchforks out.

## The Paradigm Shift

So what's the paradigm shift? Well, it's not just the way you structure your app. It's the way you think about building
your app. You're not just building a React app anymore. You're building a Next.js app. Modern day Next.js versions are
absolutely **PACKED** with features. You have so much at your disposal that it's easy to get lost.You have to think about
how plan your app, how you structure your app, how you fetch data, handle routing, handle layouts, handle error pages,
handle loading states, hey do I "use client" this page? Nah, maybe I'll load it with `next/dynamic` with SSR turned off.

The way you thought about building "The React Way ™" is tossed out the window. Now you have two problems,
how do I build this thing and how do I build this thing the Next.js way.

And think about this, let's say you just picked up Next.js and you've only used
`npx create-vite@latest --template react` before. You're most definitely gonna have a "Wtf is going on" moment.
I know I did.

## Overcoming the learning curve

So how do you overcome this learning curve? Well, the first thing you need to do is to **read the docs**. I know,
I know, "B-But docs are so boring and I end up learning more by DOING!" - I don't wanna hear it.
Next.js docs are hands-down, THE BEST WAY to get started with Next.js. Yes, you can learn by trying, yes you can
experiment your way through it, but the docs are so well written that you'll be up and running in no time.

Having trouble understanding how the app router works? Read the docs. Having trouble understanding how to fetch data?
Read the docs. Having trouble understanding how to deploy your app? [READ. THE. DAMN. DOCS.](https://nextjs.org/docs).

I can't stress this enough.

Next, you need to **build something**. You can't _just_ read the docs and expect to be a pro. You need to build
SOMETHING, _ANYTHING_. It could be a simple blog (broke the 4th wall here), a portfolio app,
a newsletter (I can't stop doing it, if it wasn't obvious already), a pokedex, a clone of your favorite website,
a clone of your favorite music streaming platform, a clone of your favorite clone. Just build something. Yes, docs will
help you get started but building something will help you understand how to apply what you've learned.
I know its cliché but it's true. You can't just read a book on how to ride a bike and expect to be a pro at it.
You need to get on that bike and fall a couple of times before you get the hang of it.

And lastly, **ask for help**. The Next.js community is pretty active.
You can ask questions on Twitter, StackOverflow, Reddit, Discord, GitHub Discussions, and chances are
someone will help you out. I've asked some pretty dumb questions on Twitter and I've always gotten a response.
This isn't the Rust community. Say whatever you want - JS folks are pretty chill. So don't be afraid to ask for help.
And that's it. That's how you overcome the learning curve. Read the docs, build something, ask for help. I know it's not
groundbreaking advice but it's what worked for me.

## Conclusion

Remember when I said I was building a newsletter for my internship? Yeah, I got so caught up in
learning Next.js that I never got around to finishing it. I did build a newsletter for my University though. And then
I built a blog. And then I built a portfolio. And then a clone of my favorite website, a clone of my favorite music streaming
platform (not Spotify, Spotify sucks and I'll die on this hill), a clone of my favorite clone - you get the point.

I did quit that internship though. They were pretty mad that I didn't finish the newsletter before I left.
But hey, I learned Next.js. And that's what matters. Right? _Right?_ **_RIGHT?!_**
