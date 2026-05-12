---
layout: project-detail
title: SimBaRepro
permalink: /projects/1_project/
description: Simulation-based, finite-sample inference for privatized data
img: assets/img/package_figures/package_illustration.png
importance: 1
category: work
project_year: 2024-25
project_kind: R package
cran_url: https://cran.r-project.org/web/packages/SimBaRepro/index.html
paper_url: https://www.tandfonline.com/doi/full/10.1080/01621459.2024.2427436
---

In 2024-25, I worked with [Prof. Jordan Awan](https://jordan-awan.com) and [Zhanyu Wang](https://scholar.google.com/citations?user=_8eFuswAAAAJ&hl=en) to turn their research on simulation-based reproducibility inference into an R package published on CRAN.

<figure class="detail-figure detail-figure-wide">
  <img
    src="{{ '/assets/img/package_figures/package_illustration.png' | relative_url }}"
    alt="Illustration of the simulation-based reproducibility inference workflow"
    loading="eager"
  >
  <figcaption>
    A high-level sketch of the inference workflow behind the package.
  </figcaption>
</figure>

The package uses simulation-based methods to obtain p-values for hypothesis tests, confidence intervals, and multivariate confidence regions from privatized data. The multivariate regions can also be projected down to two-dimensional confidence regions for visualization.

<div class="detail-figure-grid">
  <figure class="detail-figure">
    <img
      src="{{ '/assets/img/package_figures/indicator_array.png' | relative_url }}"
      alt="Indicator array representation of a two-dimensional confidence region"
      loading="lazy"
    >
    <figcaption>
      Indicator-array representation of a two-dimensional confidence region.
    </figcaption>
  </figure>
  <figure class="detail-figure">
    <img
      src="{{ '/assets/img/package_figures/confidence_region.png' | relative_url }}"
      alt="Visualization of the two-dimensional confidence region"
      loading="lazy"
    >
    <figcaption>
      The same region visualized with the package's plotting tools.
    </figcaption>
  </figure>
</div>

The [package page](https://cran.r-project.org/web/packages/SimBaRepro/index.html) on CRAN has installation details, documentation, and the current released source.
