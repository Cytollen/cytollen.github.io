---
layout: page
title: personal
permalink: /personal/
description: piano, biking, and other off-hours notes
nav: true
nav_order: 4
map: true
---

<div class="personal-page">
  <p class="personal-intro">
    A small home for the things I do away from papers and code.
  </p>

  <nav class="personal-activity-nav" aria-label="Personal activity sections">
    <a href="#piano">Piano</a>
    <a href="#biking">Biking</a>
  </nav>

  <section class="personal-section" id="piano">
    <div class="personal-section-heading">
      <p class="personal-section-kicker">music</p>
      <h2>Piano</h2>
    </div>
    <div class="personal-note">
      Performance notes and recordings will live here.
    </div>
  </section>

  <section class="personal-section" id="biking">
    <div class="personal-section-heading">
      <p class="personal-section-kicker">rides</p>
      <h2>Biking</h2>
    </div>

    <div class="personal-bike-stats" aria-label="Biking summary">
      <div>
        <span data-ride-count>0</span>
        <small>rides</small>
      </div>
      <div>
        <span data-ride-distance>0 km</span>
        <small>distance</small>
      </div>
      <div>
        <span data-ride-photos>0</span>
        <small>photo rides</small>
      </div>
    </div>

    <div class="personal-bike-layout">
      <div id="chicago-rides-map" class="personal-ride-map" aria-label="Chicago biking routes"></div>
      <aside class="personal-ride-panel" id="ride-detail" aria-live="polite"></aside>
    </div>

    <ol class="personal-ride-list" id="ride-list"></ol>
  </section>
</div>

<script defer src="{{ '/assets/js/personal-rides.js' | relative_url | bust_file_cache }}"></script>
