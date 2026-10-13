---
layout: blog-post
title: The Music of a Passing Train
date: 2026-10-12
permalink: /blog/the-music-of-a-passing-train/
description: "Estimating train speed from musical intervals, and the pleasure of exploring a question in the era of AI."
math: true
---

I was cycling with a group of friends from Hyde Park in Chicago toward Indiana Dunes when a train roared past on the tracks beside us, sounding its horn. For a few seconds, my thoughts were scattered by the loud clatter of wheels on rails. As the noise faded and I re-gathered my thoughts, what stayed with me was the drop in the pitch of the train horn as it passed us. I recognize the Doppler effect, but

*could I estimate how fast the train was traveling just from that change in pitch?*

It turns out that the answer is yes. And with a small approximation, there is a surprisingly simple relationship between musical intervals and the speed of the train.

## From frequency ratio to speed

First, some notation:

$$
\begin{aligned}
 v_t &:\ \text{the speed of the train},\\
 v_s &:\ \text{the speed of sound in the surrounding air},\\
 f^* &:\ \text{the horn's frequency when the train is at rest},\\
 f^+ &:\ \text{the frequency heard as the train approaches},\\
 f^- &:\ \text{the frequency heard as the train moves away}.
\end{aligned}
$$

I was moving on my bicycle, but imagine that I had stopped to listen[^bicycle]. Assume still air, a constant train speed well below the speed of sound, and one steady frequency component of the horn that we can follow throughout. Compare the horn's pitch well before and after the train passes, so its motion is almost directly toward or away from me.

Under these assumptions, the Doppler effect gives

$$
f^+=f^*\frac{v_s}{v_s-v_t},
 \qquad
 f^-=f^*\frac{v_s}{v_s+v_t}.
$$

Taking their ratio,

$$
R:=\frac{f^+}{f^-}=\frac{v_s+v_t}{v_s-v_t}.
$$

*The original frequency $$f^*$$ cancels out*. We don't need to know the original frequency of the horn, only the ratio between $$f^+$$ and $$f^-$$. Solving for the speed of the train gives

$$
v_t=\frac{R-1}{R+1}\,v_s.
\tag{1}\label{eq:doppler}
$$

## The connection to musical intervals

In twelve-tone equal temperament, the tuning system underlying most modern Western music, one octave corresponds to a doubling of the frequency. Each semitone multiplies the frequency by a factor of $$2^{1/12}$$, so a difference of $$n$$ semitones corresponds to the ratio

$$
R=2^{n/12}.
$$

Here, $$n$$ denotes the number of semitones between the higher pitch $$f^+$$ and the lower pitch $$f^-$$. A minor second has $$n=1$$, a minor third has $$n=3$$, and an octave has $$n=12$$. More generally, $$n=12\log_2(f^+/f^-)$$, which need not be an integer.

Substituting this frequency ratio into $$\eqref{eq:doppler}$$ yields

$$
\boxed{\displaystyle v_t=\frac{2^{n/12}-1}{2^{n/12}+1}\,v_s.}
$$

*A musical interval can tell us the speed of a train relative to the speed of sound.*

At approximately $$20^\circ\mathrm{C}$$, the speed of sound in air is $$v_s\approx343\ \mathrm{m/s}$$. That gives us the following correspondence:

| Musical interval | Semitones $$n$$ | Train speed |
| :--- | :---: | ---: |
| Minor second | 1 | 35.7 km/h |
| Major second | 2 | 71.2 km/h |
| Minor third | 3 | 106.7 km/h |
| Major third | 4 | 142.0 km/h |
| Perfect fourth | 5 | 177.1 km/h |
| Tritone | 6 | 211.9 km/h |
|  | $$\vdots$$ |  |
| Octave | 12 | 411.6 km/h |

There is an even simpler rule of thumb. Since

$$
\frac{2^{n/12}-1}{2^{n/12}+1}
 =\tanh\!\left(\frac{n\ln 2}{24}\right),
$$

we can approximate $$\tanh x$$ with a linear function for small $$x$$ so that

$$
v_t \approx (35\ \mathrm{km/h})\,n.
$$

In ordinary train speeds, *each semitone of pitch difference corresponds to roughly 35 km/h*. A drop of a minor third, or three semitones, gives an estimate of **105 km/h** (exact calculation gives 106.7 km/h). For a drop of an entire octave, the linear approximation gives **420 km/h** (exact calculation gives 411.6 km/h).[^mars] For speeds below 400 km/h, this linear approximation is off by at most $$2\%$$.

## A thought in the era of AI

While I was still on my way to Indiana Dunes, I checked the reasoning above by talking to ChatGPT. Later, I also asked it to convert my LaTeX draft to Markdown and polish the language. That made me wonder: what remains valuable about exploring a question when AI can help us reach an answer so quickly?

For me, much of the joy lies in noticing a phenomenon, formulating a question, and then pursuing an answer. AI may discover connections much faster than we do, and uncover beautiful connections that we would never have discovered on our own. That does not diminish the pleasure of exploring and understanding for ourselves. The next time I hear a train pass by, I'll be able to estimate its speed, and also remember the pleasure of working through this problem.

[^bicycle]: Had I known my speed and direction, I could have accounted for my own motion. But I ride too fast to be measurable...

[^mars]: Just in case you are reading this on Mars, where sound travels at roughly $$240$$--$$250\ \mathrm{m/s}$$ depending on its frequency, similar calculations will give about **25--26 km/h per semitone** instead of Earth's **35.7 km/h**. ([NASA](https://www.nasa.gov/solar-system/what-sounds-captured-by-nasas-perseverance-rover-reveal-about-mars/))
