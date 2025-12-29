---
layout: page
title: sound
permalink: /sounds/
nav: false
nav_order: 4
---

Collection of sounds or recordings.

<ul>
  {% for sound in site.data.sounds %}
    <li>
      <strong>{{ sound.title }}</strong><br>
      <audio controls>
        <source src="{{ '/assets/audio/' | append: sound.file | relative_url }}" type="audio/mp4">
        Your browser does not support the audio element.
      </audio>
    </li>
  {% endfor %}
</ul>
