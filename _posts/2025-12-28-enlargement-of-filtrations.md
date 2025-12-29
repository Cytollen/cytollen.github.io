---
layout: post
title: "Enlargement of Filtrations"
date: 2025-12-28
description: A short introduction to filtration enlargement in probability theory. 
tags: [probability, stochastic processes, finance]
categories: blog
math: true
bibliography: references.bib
---



# Introduction
In stochastic modeling, we often work with a *filtered probability
space* $(\Omega, \mathcal{F},\mathbb{F},\mathbb{P})$ where the
probability measure $\mathbb{P}$ encodes our "beliefs", and the
filtration---collection of
$\sigma$-algebras--- $$\mathbb{F}=(\mathcal{F}_t)_{t\ge0}$$ represents the
information that's available to us at any time. In Bayesian inference,
we typically update our beliefs by changing the probability measure.
However, there are many situations in engineering and
finance where it's more natural to change the filtration while holding
the probability measure fixed.

For instance, imagine an investor who gains insider information about
the outcome of a future random variable (e.g., default price, terminal
price). This extra information alters the structure of "fairness\" in
the underlying stochastic system, i.e., processes that were martingales
under the original information may no longer be so under the new one.

The mathematical framework that studies how stochastic processes behave
under such changes in information is called *Enlargement of
Filtrations*, which has been studied extensively in the probability
literature; see {% cite Grigorian2023 Jacod2006 Jeanblanc2009 %}.

# Foundations

Before diving into filtration enlargement, it's worth reviewing a few
basic concepts in probability theory. A probability space is a triple
$(\Omega, \mathcal{F},\mathbb{P})$, consisting of:

-   $\Omega$: a set of possible outcomes,

-   $\mathcal{F}$: a set of measurable (observable) events,

-   $\mathbb{P}$: a probability measure assigning likelihoods to events
    in $\mathcal{F}$.

In the presence of a temporal dimension (e.g., when working with
stochastic processes), it's helpful to specify not only what events are
measurable (according to $\mathcal{F}$) but also at what time they
become measurable. This leads to the concept of a *filtration*:

$$\mathbb{F}=(\mathcal{F}_t)_{t\ge 0}$$ 

where each $$\mathcal{F}_t$$ encodes the information available at time $t$. A *filtered probability
space* is simply the quadruple $(\Omega, \mathcal{F},\mathbb{F},\mathbb{P})$. A stochastic process
$(X_t)_{t\ge0}$ is said to be *adapted* to $\mathbb{F}$ if $X_t$ is
$\mathcal{F}_t$-measurable for all $t$. That is, the value of $X_t$ can
be determined exactly by the information available at time $t$.

## Martingales and Semi-martingales

Let
$$(\Omega, \mathcal{F},\mathbb{F}=(\mathcal{F}_t)_{t\ge0},\mathbb{P})$$ be
a filtered probability space, and let $M_t$ be an $\mathbb{F}$-adapted
stochastic process with $\mathbb{E}\left|M_t\right|<\infty$ for all $t$.
If $$\mathbb{E} \!\left[M_t|\mathcal{F}_s\right]=M_s$$ for all
$0\le s< t$, then $M_t$ is said to be an $\mathbb{F}$-martingale.
Intuitively, a martingale represents a "fair game\": given the current
information, its expected future value is just the present value. A
process $X_t$ is a *semimartingale* if it can be decomposed as
$$X_t=M_t+A_t$$ where $M_t$ is a local martingale (which behaves like a
martingale up to random stopping times)[^1] and $A_t$ is an
$\mathbb{F}$-adapted finite-variation process. Semimartingales form the
largest class of stochastic processes for which we can talk about Itô
calculus.

# Enlargement of filtrations

A martingale represents a fair game, but fairness is only relative to
the filtration (relative to the given information). A fair game in the
eyes of one player may not be a fair game in the eyes of another.

Consider two students who are taking bets based on a one-dimensional
Brownian motion $X_t$. One has access only to the natural filtration
$\mathbb{F}$ (consisting of the values of the Brownian motion up to
current time), while the other secretly knows the value of some random
variable $\zeta$ (e.g. value of the Brownian motion at some later time
$T$). From the perspective of the better-informed student, an
$\mathbb{F}$-Brownian motion $X_t$ may no longer be a martingale
considering the information from $\zeta$. Describing $X_t$ in the
presence of extra information is the goal of Enlargement of Filtrations.

## Setup

There are two main types of "enlargement\":

-   **Initial enlargement:** all secret information is available at time
    $0$.

-   **Progressive enlargement:** information is gradually revealed over
    time.

We will focus on the first case. Let
$$\mathbb{F} = (\mathcal{F}_t)_{t \ge 0}$$ be the original filtration, and
let $\zeta$ be an $\mathcal{F}$-measurable random variable taking values
in some measurable space $E$. We define the *enlarged filtration*
$$\mathbb{G} = (\mathcal{G}_t)_{t \ge 0}$$ by

$$\mathcal{G}_t = \mathcal{F}_t \vee \sigma(\zeta),$$

where $\vee$ denotes the smallest $\sigma$-algebra containing elements from
$\mathcal{F}_t$ and $\sigma(\zeta)$. Intuitively, $\mathbb{G}$ describes
a world in which the value of $\zeta$ is known from the start---one has
"insider" information about $\zeta$ at time $0$.

## The $\mathcal{H}$ and $\mathcal{H}'$ Hypotheses

The central question is how martingales behave under a filtration
enlargement.

If every $\mathbb{F}$-martingale remains a $\mathbb{G}$-martingale, we
say that $\mathbb{F}$ is *immersed* in $\mathbb{G}$, or that the pair
$(\mathbb{F}, \mathbb{G})$ satisfies the **$\mathcal{H}$-hypothesis**.
This is quite a strong condition---informally, it means that the extra
information carried by $\zeta$ does not interfere with the "fairness" of
any $\mathbb{F}$-martingale.

A weaker but more flexible condition is the
**$\mathcal{H}'$-hypothesis**: every $\mathbb{F}$-martingale remains a
$\mathbb{G}$-*semimartingale*. Under this assumption, Itô calculus
remains valid, but an additional drift term may appear when expressing
the $\mathbb{F}$-martingale in the $\mathbb{G}$ filtration.

## Jacod's condition

Among several sufficient conditions ensuring the
$\mathcal{H}'$-hypothesis, *Jacod's condition* is often the most
convenient in practice. The following statements (theorem and lemma) are
adapted from [@Grigorian2023].

::: theorem
**Theorem 1** (Jacod's condition). *Let $\zeta$ be a random element in a
standard Borel space $(E,\mathcal{E})$, and let $Q_t(\omega, dx)$ be the
regular conditional distribution of $\zeta$ given $\mathcal{F}_t$ for
all $t\ge0$. Suppose that there exists a positive $\sigma$-finite[^2]
measure $\eta$ on $(E,\mathcal{E})$ such that

$$Q_t(\omega, dx)\ll\eta(dx)\text{ a.s., }\forall t\ge0.$$

Then $\mathcal{H}'$ holds.*
:::

Just knowing that a process remains a semimartingale is usually not
enough, we typically would like the semimartingale decomposition in the
enlarged filtration[^3] $\mathbb{F}^{\sigma(\zeta)}$. To do so, we need
the following lemma and theorem.

**Lemma 1**. Under $\mathcal{J}$, there exists a nonnegative
$\mathcal{O}(\mathbb{F})\times\mathcal{B}(\bar{\mathbb{R}})$-measurable
function
$$\Omega\times \mathbb{R}_+\times\bar{\mathbb{R}}\ni (\omega, t,x)\mapsto p_t(\omega, x)$$
cadlag in $t$ such that*

-   *$Q_t(\omega,dx)=p_t(\omega,x)\eta(dx)$ for every $t\ge0$,*

-   *for each $x\in\bar{\mathbb{R}}$, the process $(p_t(x))_{t\ge0}$ is
    an $\mathbb{F}$-martingale,*

-   *$p(x)>0$ and $p_-(x)>0$ on[^4] $$⟦0,\zeta^x ⟦$$ and
    $p(x)=0$ on $$⟦\zeta^x,\infty⟦$$, where
    $\zeta^x:=\inf\{t:p_{-}(x)=0\}$.
:::

**Theorem 2**. *Suppose that the random element $\zeta$ satisfies
$\mathcal{J}$. If $X$ is an $\mathbb{F}$-local martingale, the process
$\tilde{X}$ defined as

$$\tilde{X}_t:=X_t-\int_0^t\frac{1}{p_{s-}(\zeta)}d\langle{X,p(u)\rangle}^\mathbb{F}_s|_{u=\zeta}, \quad t\le T\quad$$

is an $\mathbb{F}^{\sigma(\zeta)}$-local martingale.*
:::

## Example: Brownian bridge via initial enlargement

Consider a standard Brownian motion $B=(B_t)_{t\ge 0}$ on
$(\Omega,\mathcal{F},\mathbb{F},\mathbb{P})$ with its natural filtration
($\mathcal{F}_t=\sigma(X_s,0\le s\le t)$). Suppose we enlarge
$\mathbb{F}$ with the information given by $\zeta:=B_T$, i.e.,

$$\mathcal{G}_t = \mathcal{F}_t \vee \sigma(B_T), \qquad \mathbb{G}=(\mathcal{G}_t)_{t\ge 0}.$$

Again, $\mathbb{G}$ is assumed to be right-continuous by taking

$$\mathcal{G}^+_t=\bigcap_{s>t}\mathcal{G}_s.$$

Our goals are:

1.  Verify Jacod's condition;

2.  Compute the semimartingale decomposition of $B$ w.r.t. $\mathbb{G}$;

#### Step 1: Verifying Jacod's condition.

For $t<T$, the conditional law of $B_T$ given $\mathcal{F}_t$ is
Gaussian:


$$B_T \mid \mathcal{F}_t \sim \mathcal{N}\big(B_t,\; T-t\big).$$ 

Hence, there exists a dominating measure (the Lebesgue measure) $\eta(dx)=dx$.
$Q_t(\omega,dx)$ has a density with respect to Lebesgue measure:
$Q_t(\omega,dx) \;=\; p_t(\omega,x)\,dx$, with

$$p_t(x) = \frac{1}{\sqrt{2\pi (T-t)}}\exp\!\Big(-\frac{(x-B_t)^2}{2(T-t)}\Big),\quad 0\le t<T.$$

Thus $Q_t(\cdot,dx)\ll \eta (dx)$ a.s. for each $t<T$, so Jacod's
condition holds on $[0, t)$. (On $[T,\infty)$, the conditional law is
degenerate at $B_T$.)

#### Step 2: Computing the semimartingale decomposition.

We apply Theorem 2 with $X=B$. To do so, we first compute
the $\mathbb{F}$-predictable covariation
$\langle B, p(x)\rangle^\mathbb{F}$. By Itô's formula, we can get

$$dp_t(x) = \partial_{B_t} p_t(x)\, dB_t
\;=\; \frac{x-B_t}{T-t}\, p_t(x)\, dB_t, \qquad t<T.$$ 

Hence the predictable covariation with $B$ is just

$$d\big\langle B, p(x)\big\rangle_t^{\mathbb{F}} = \frac{x-B_t}{T-t}\, p_t(x)\, dt, 
\qquad 0\le t<T.$$ 

Plugging this into $(*)$ with $x=\zeta=B_T$, we obtain from Theorem [2] that the process

$$\tilde{B}_t:=B_t-\int_0^t\frac{B_T-B_s}{T-s}\,ds, \qquad0\le t<T$$ 

is a $\mathbb{G}$-local martingale. Since $B$ is continuous with quadratic
variation $[B]_t=t$, it follows that $[\tilde{B}]_t=t$ as well, and by
Lévy's characterization $\tilde{B}$ is a $\mathbb{G}$-Brownian motion on
$[0,T)$. Equivalently, $B$ admits the $\mathbb{G}$-semimartingale (indeed, SDE)
representation 

$$dB_t = d\tilde{B}_t \;+\; \frac{B_T - B_t}{T-t}\, dt, 
\qquad 0\le t<T,$$

 where $\tilde{B}$ is a $\mathbb{G}$-Brownian motion.
This is precisely the *Brownian bridge* drift toward the terminal
pinning value $B_T$.

## Notes

[^1]: A process $M_t$ is a local martingale if there exists and
    increasing sequence of stopping times $\tau_n\nearrow\infty$ such
    that each stopped process $M_{t\wedge\tau_n}$ is a martingale.

[^2]: *A measure is called $\sigma$-finite if it can be written as a
    countable union of finite measures.*

[^3]: We use $\mathbb{F}^{\sigma(\zeta)}$ to denote the right-continuous
    version of the enlarged filtration $\mathbb{F}\lor \sigma(\zeta)$.

[^4]: *The double square bracket is used for intervals with random
    boundary points.*
    
 
 ## References

{% bibliography --cited %}
