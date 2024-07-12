---
title: "How I Accidentally Became YouTube Music's Unofficial UX Designer - Better Lyrics"
date: "2024-07-12"
banner: "https://www.youtube.com/watch?v=GACsqMfhDVE"
labels: ['Story', 'Extension', 'Javascript']
description: >
  From fixing lyrics to features Google missed - how my side project became 1500+ users' must-have extension for YouTube Music.
---

## Why I made Better Lyrics

To set the stage, I am a YouTube Music "fan." In my opinion, the recommendation algorithm is brilliant and fits my use
case orders of magnitude better than Spotify. However, since this is a Google product (and other than the constant fear
of it being randomly sunset), the UX is pretty trash — especially the lyrics. They've hardly made any changes to their
web app over the past several years, and their interface looks like something straight out of 2016 at times.

Now I was all-in on YouTube Music, I had canceled my Spotify subscription and was using it daily, the listening experience
was great, hell, I'd argue it was better than Spotify. To be fair, the lyrics were reliable, granted they were a bit
small and hard to read, but they were there. But the problem begins when you start listening to "non-mainstream" music.

![Default Youtube Music Lyrics](https://res.cloudinary.com/boidu/image/upload/q_auto:eco/v1720787071/Screenshot_2024-07-12_at_17.54.03_qab069.png)
_Default Youtube Music Lyrics_

Almost all the time, the lyrics are just missing. I'm not talking about the lyrics being wrong, I'm talking about them
not being there at all. Now I'm not sure if this is a licensing issue or what, but it was a massive pain in the ass for me.

That's when I decided to make them look better - at least from my own sake.

## How it started

It started out as an Arc Boost (fancy way of saying UserScripts) to fix an issue I thought was really niche — the fact that
default YouTube Music lyrics suck. The initial iteration was quick. Arc boosts are incredibly easy to setup - you click on
the boost icon and write some CSS (and javascript if you want to) and voila! You have essentially created a mini extension.

Using Arc Boosts as a debug tool significantly improved my speed-to-ship! At first, I just made the font size bigger,
replaced the original font with [Satoshi](https://www.fontshare.com/fonts/satoshi) and threw in a little CSS magic like gradient
masks here and there and the end result was pretty solid. But I wanted to go one step further.

This was when I decided to make the lyrics "sync", i.e, what you'd see with Spotify or Apple Music - Lyrics scrolling
into view when they are being spoken. My original thought process was - "Hey, Youtube Music's mobile app has time-synced
lyrics, they must be using the same endpoint for the web app too, right? Probably ignoring the timestamps?".
Spoiler alert: they weren't and honestly I couldn't figure out why.

Why use two different end points for your mobile
and web app - actually, why not provide time-synced lyrics on your web app as well!? Anyways, I had to take a step back.
I tried to reverse engineer end points they were using on their app, but I couldn't.

## The backend

While researching for ways to get time-synced lyrics, I stumbled upon [this repository](https://github.com/akashrchandran/spotify-lyrics-api).
Now while this was excellent, it didn't really satisfy my exact use case. I checked out the outine of the API and how it
worked and decided to make my own. The initial iteration was with Express and Typescript, and that took like a weekend to
get up and running. I won't go into the specifics of the API, but the general idea was pretty much exactly like
Spotify Lyrics API.

![Initial version of Better Lyrics with synced lyrics - Running from an Arc Boost](https://res.cloudinary.com/boidu/image/upload/q_auto:eco/v1720787164/Screenshot_2024-06-03_at_17.39.31_ookltg.png)
_Initial version of Better Lyrics with synced lyrics - Running from an Arc Boost_

Great! Now I had a backend that could provide me with time-synced lyrics. I was ready to implement
this into my extension. It was not too difficult to implement and I was able to get it up and running in another couple
of days.

## The extension

On 2nd June, I made a [tweet](https://x.com/boidushya/status/1797057452162039973) about the Arc Boost, followed
by [another](https://x.com/boidushya/status/1797213945129767309). The response was excellent! People were genuinely
interested in an extension version of this. I had never made a browser extension before, but I had a rough idea of how
they worked.

![Twitter post showing the Arc Boost version](https://res.cloudinary.com/boidu/image/upload/q_auto:eco/v1720787426/cbe97639-ad37-4ad0-9cec-b529ecc50626.png)
_Twitter post showing the Arc Boost version_

Originally I wanted to use [extensions.js.org](https://extension.js.org/) to create it, but I
decided to go with the more traditional way - YOLO-ing it & setting everything up from scratch. Well, to my surprise and
to be quite frank, it was incredibly easy to set up. I had the extension up and running in no time.

The extension was pretty simple
to setup as well since I had already done the hard part - the backend. The extension was essentially a wrapper around
the Arc Boost, with a few extra features like a settings page. I also added a feature where you could click on the
lyrics to skip to that part of the song. The extension was ready to ship!

## The launch

On 5th June, I [launched](https://x.com/boidushya/status/1798405072625520902) the extension. I was expecting a few
people to use it, but MAN was I wrong. The tweet started doing rounds on Twitter, and the extension got its initial
liftoff.

![Twitter post about Better Lyrics Launch](https://res.cloudinary.com/boidu/image/upload/q_auto:eco,c_crop,g_north,h_1295,w_1182,x_0,y_104/v1720787300/8b77e210-74b7-48a1-b4dc-6aa9c2bdf257.png)
_Twitter post about Better Lyrics Launch_

Now, once I passed the "100 users" mark, I started noticing something. The backend was not able to handle the load. I was
using Railway's hobby tier and it was peaking at **600mb** of memory. Mind you, I wasn't doing anything fancy, just fetching
lyrics from an API and sending them back - no caching, no nothing.

Back then I was in another city with a friend who was also a developer. He was working as a Golang dev at a
company, and he suggested I use it for the backend. I had never used Go before, but I was willing to give it a
shot.

## The rewrite

Here's the thing about Go - it's fast. Not just in terms of runtime, but also in terms of development. If I remember
correctly, [ThePrimeagen](https://x.com/ThePrimeagen) mentioned this comparison in one of his videos - "Go is like
Scratch for adults". And he was spot on. The language is incredibly easy to pick up, and the standard library is just
so jam packed with features that you don't really need to use any third party modules.

I was able to rewrite the entire backend in one night.
Keep in mind, I'd never used Go before in a production environment- all I knew were the basics.
But I was able to get the backend up and running pretty quickly - thanks to the excellent documentation and the
community around it. I got it deployed on Railway, and it was running like a horse on coke.

The memory usage was down to - _wait for it_ - _**15mb**_! The response times were lightning fast as well.
I got so carried away I decided to implement a caching layer as well. Added some standard IP rate limiting and we were
ready to Go (I'm so good with puns).

## The aftermath

I let the extension do its thing for a few days, and I was getting more and more users. I was getting feedback from them
and the "fix bugs, add features" cycle was picking up pace. Meanwhile I made two posts on Reddit - one on [r/youtubemusic](https://www.reddit.com/r/YoutubeMusic/comments/1db1j6a/introducing_better_lyrics_enhance_your_youtube/)
and another on [r/webdev](https://www.reddit.com/r/webdev/comments/1dran79/i_built_a_browser_extension_for_youtube_music/).
I also launched it on [Product Hunt](https://www.producthunt.com/posts/better-lyrics).

Somewhere along the way, I decided to make a website for the extension, which didn't take too
long at all since that's what I do for a living.

Fast forward to today, the extension has over 1500 daily active users, and has about 70,000 impressions across web stores.
It's caching around 10,000 lyrics daily, which is pretty mind-blowing to me.
The project has grown so much, I had to make a [status page](https://better-lyrics-status.boidu.dev) to improve reliability
and transparency.

One of the sicker developments is that the extension has been "Featured" under the Entertainment category on the
Chrome Web Store. This, of course, has helped attract even more users.

What started as a simple fix for lackluster lyrics has evolved into a full-fledged browser extension with features like
beautiful time-synced lyrics, real-time translations, and more. It's available now for Chrome, Firefox, and Edge, and
the response from users has been overwhelmingly positive.

![Full Screen Mode - Better Lyrics](https://res.cloudinary.com/boidu/image/upload/q_auto:eco/t_banner/v1720783608/Screenshot_2024-06-20_at_11.44.23_wwwrcc.png)
_Full Screen Mode - Better Lyrics_

If you're interested in checking it out, you can find all the details on the [Better Lyrics website](https://better-lyrics.boidu.dev).

This journey from a side project to a widely-used tool has been incredibly rewarding. It's shown me the power of
addressing a niche problem and how it can resonate with thousands of users.

And yeah, one last thing: Hey Google or anyone from the YouTube Music team, if
you're reading this, hit me up. I've got some ideas for your next update ;)
