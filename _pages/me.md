---
layout: photo-page
title: Photo
permalink: /me/
description: Portrait of Xinlong Du.
---

<figure class="photo-frame">
  <picture>
    <source
      type="image/webp"
      srcset="{{ '/assets/img/me/portrait-960.webp' | relative_url }} 960w, {{ '/assets/img/me/portrait-1920.webp' | relative_url }} 1920w"
      sizes="(max-width: 800px) calc(100vw - 2rem), (max-width: 968px) calc(100vw - 2.5rem), 928px"
    >
    <img
      src="{{ '/assets/img/me/portrait.jpg' | relative_url }}"
      alt="Xinlong Du smiling outdoors beside red leaves"
      width="1920"
      height="1280"
      loading="eager"
    >
  </picture>
</figure>
