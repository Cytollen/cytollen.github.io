---
layout: page
title: SimBaRepro
description: Simulation-based, Finite-sample Inference for Privatized Data
img: assets/img/package_figures/package_illustration.png
importance: 1
category: work
related_publications: true
---

In 2024-25, I had the honor of working with <a href="https://jordan-awan.com">Prof. Jordan Awan</a> and <a href="https://scholar.google.com/citations?user=_8eFuswAAAAJ&hl=en">Zhanyu Wang</a> to turn their <a href="https://www.tandfonline.com/doi/full/10.1080/01621459.2024.2427436">research paper</a> into an R package published on CRAN.

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/package_figures/package_illustration.png" title="package illustration" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    This figure shows a rough description of the main idea behind the paper by Awan and Wang.
</div>

Through simulation-based methods, users can obtain p-values for hypothesis tests, confidence intervals, and multivariate confidence regions. Multivariate confidence regions can also be projected down to two-dimensional confidence region before they can be visualized.

<div class="row justify-content-sm-center">
    <div class="col-sm-8 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/package_figures/indicator_array.png" title="indicator array" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm-4 mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/package_figures/confidence_region.png" title="2d plot of the array" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    The figure on the left shows a two-dimensional confidence region (1 indicates inclusion), and we can visualize it easily with the built-in `plot_grid` function (figure on the right).
</div>

To use the package or to see more details, see <a href="https://cran.r-project.org/web/packages/SimBaRepro/index.html">SimBaRepro</a>.
