(() => {
  // Add image objects to a ride's photos array to make that route open a gallery when clicked.
  const rides = [
    {
      id: "2026-04-18-afternoon-ride",
      title: "Afternoon Ride",
      date: "April 18, 2026",
      area: "Chicago, Illinois",
      distanceKm: 11.77,
      elevationM: 45,
      time: "45m 14s",
      photos: [],
      path: [
        [41.8519, -87.6465],
        [41.8574, -87.6462],
        [41.8574, -87.6317],
        [41.862, -87.6306],
        [41.8628, -87.6239],
        [41.8582, -87.6206],
        [41.8504, -87.6187],
        [41.8415, -87.6137],
        [41.8285, -87.607],
        [41.8205, -87.5999],
        [41.8115, -87.5906],
        [41.8027, -87.5834],
        [41.793, -87.5792],
        [41.7862, -87.5794],
      ],
    },
    {
      id: "2026-04-26-evening-ride",
      title: "Evening Ride",
      date: "April 26, 2026",
      area: "DuPage County, Illinois",
      distanceKm: 42.33,
      elevationM: 66,
      time: "2h 48m",
      photos: [],
      path: [
        [41.8889, -87.9495],
        [41.8875, -87.922],
        [41.8845, -87.893],
        [41.8818, -87.865],
        [41.8795, -87.835],
        [41.8845, -87.805],
        [41.8842, -87.7705],
        [41.884, -87.735],
        [41.8815, -87.7],
        [41.881, -87.665],
        [41.8788, -87.638],
        [41.875, -87.624],
        [41.8685, -87.6175],
        [41.854, -87.6155],
        [41.8385, -87.61],
        [41.8245, -87.601],
        [41.811, -87.59],
        [41.7965, -87.582],
        [41.7872, -87.5795],
        [41.7798, -87.5765],
      ],
    },
    {
      id: "2026-05-07-morning-ride",
      title: "Morning Ride",
      date: "May 7, 2026",
      area: "Whiting, Indiana",
      distanceKm: 18.4,
      elevationM: 32,
      time: "1h 0m",
      photos: [],
      path: [
        [41.6957, -87.5364],
        [41.696, -87.525],
        [41.6885, -87.522],
        [41.6862, -87.516],
        [41.6787, -87.511],
        [41.6725, -87.505],
        [41.667, -87.496],
        [41.659, -87.488],
        [41.6515, -87.479],
        [41.6445, -87.4685],
        [41.6375, -87.4568],
      ],
    },
    {
      id: "2026-05-08-afternoon-ride",
      title: "Afternoon Ride",
      date: "May 8, 2026",
      area: "Chicago, Illinois",
      distanceKm: 13.26,
      elevationM: 39,
      time: "44m 40s",
      photos: [],
      path: [
        [41.844, -87.649],
        [41.8505, -87.64],
        [41.8568, -87.636],
        [41.8581, -87.6268],
        [41.8643, -87.6245],
        [41.8583, -87.6197],
        [41.846, -87.6165],
        [41.835, -87.6095],
        [41.8225, -87.6022],
        [41.81, -87.5915],
        [41.798, -87.5835],
        [41.7875, -87.5796],
        [41.7805, -87.592],
        [41.7718, -87.5915],
        [41.7715, -87.606],
        [41.777, -87.607],
      ],
    },
    {
      id: "2026-05-08-evening-ride",
      title: "Evening Ride",
      date: "May 8, 2026",
      area: "Chicago, Illinois",
      distanceKm: 10.28,
      elevationM: 13,
      time: "34m 19s",
      photos: [],
      path: [
        [41.848, -87.635],
        [41.8425, -87.635],
        [41.8424, -87.627],
        [41.8421, -87.6165],
        [41.833, -87.6165],
        [41.821, -87.6165],
        [41.8085, -87.6163],
        [41.796, -87.616],
        [41.789, -87.613],
        [41.7858, -87.608],
        [41.777, -87.608],
        [41.7765, -87.599],
      ],
    },
    {
      id: "2026-05-10-evening-ride",
      title: "Evening Ride",
      date: "May 10, 2026",
      area: "Chicago, Illinois",
      distanceKm: 1.23,
      elevationM: 0,
      time: "2m 9s",
      photos: [],
      path: [
        [41.7868, -87.6015],
        [41.7938, -87.6018],
        [41.7942, -87.5935],
        [41.7943, -87.5865],
        [41.794, -87.5795],
        [41.7928, -87.5745],
        [41.7916, -87.5705],
        [41.7938, -87.5678],
        [41.7905, -87.5695],
      ],
    },
  ];

  const routeColor = "#fc4c02";
  const routeColorSoft = "#f68b55";

  function hasPhotos(ride) {
    return Array.isArray(ride.photos) && ride.photos.length > 0;
  }

  function photoSource(src) {
    if (!src) return "";
    if (/^(https?:)?\/\//.test(src) || src.startsWith("/")) return src;
    return `/${src.replace(/^\/+/, "")}`;
  }

  function renderStats() {
    const totalDistance = rides.reduce((sum, ride) => sum + ride.distanceKm, 0);
    const photoRides = rides.filter(hasPhotos).length;

    document.querySelectorAll("[data-ride-count]").forEach((node) => {
      node.textContent = String(rides.length);
    });
    document.querySelectorAll("[data-ride-distance]").forEach((node) => {
      node.textContent = `${totalDistance.toFixed(2)} km`;
    });
    document.querySelectorAll("[data-ride-photos]").forEach((node) => {
      node.textContent = String(photoRides);
    });
  }

  function rideMetaHtml(ride) {
    return `
      <div class="personal-ride-meta">
        <div><span>${ride.distanceKm.toFixed(2)} km</span><small>distance</small></div>
        <div><span>${ride.elevationM} m</span><small>elev gain</small></div>
        <div><span>${ride.time}</span><small>time</small></div>
        <div><span>${ride.area}</span><small>area</small></div>
      </div>
    `;
  }

  function renderOverview(detailElement) {
    const longestRide = rides.reduce((longest, ride) => (ride.distanceKm > longest.distanceKm ? ride : longest), rides[0]);

    detailElement.innerHTML = `
      <h3>Recent Chicago rides</h3>
      <p>${rides.length} rides traced from April and May 2026.</p>
      ${rideMetaHtml(longestRide)}
      <p class="personal-ride-subtitle">Longest route shown: ${longestRide.date}.</p>
    `;
  }

  function renderRide(detailElement, ride) {
    const gallery = hasPhotos(ride)
      ? `<div class="personal-ride-gallery">${ride.photos
          .map(
            (photo) =>
              `<img src="${photoSource(photo.src)}" alt="${photo.alt || `${ride.title} photo`}">`
          )
          .join("")}</div>`
      : "";

    detailElement.innerHTML = `
      <h3>${ride.title}</h3>
      <p class="personal-ride-subtitle">${ride.date}</p>
      ${rideMetaHtml(ride)}
      ${gallery}
    `;
  }

  function renderRideList(detailElement) {
    const listElement = document.getElementById("ride-list");
    if (!listElement) return;

    listElement.innerHTML = "";

    rides.forEach((ride) => {
      const item = document.createElement("li");
      const photoReady = hasPhotos(ride);
      const content = document.createElement(photoReady ? "button" : "div");

      content.className = photoReady ? "personal-ride-button" : "personal-ride-static";
      if (photoReady) {
        content.type = "button";
        content.addEventListener("click", () => renderRide(detailElement, ride));
      }

      content.innerHTML = `
        <span class="personal-ride-date">${ride.date}</span>
        <span class="personal-ride-title">${ride.title}</span>
        <span class="personal-ride-subtitle">${ride.distanceKm.toFixed(2)} km - ${ride.time}</span>
        ${photoReady ? '<span class="personal-photo-tag">photos</span>' : ""}
      `;

      item.appendChild(content);
      listElement.appendChild(item);
    });
  }

  function initMap(detailElement) {
    const mapElement = document.getElementById("chicago-rides-map");
    if (!mapElement) return;

    if (typeof L === "undefined") {
      mapElement.innerHTML = '<div class="personal-map-fallback">Map could not load.</div>';
      return;
    }

    const chicagoBounds = L.latLngBounds([41.59, -88.02], [42.05, -87.42]);
    const routeBounds = L.latLngBounds(rides.flatMap((ride) => ride.path));

    const map = L.map(mapElement, {
      maxBounds: chicagoBounds,
      maxBoundsViscosity: 0.9,
      minZoom: 9,
      maxZoom: 15,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      className: "personal-map-tiles",
      maxZoom: 19,
    }).addTo(map);

    rides.forEach((ride) => {
      const photoReady = hasPhotos(ride);
      const baseWeight = photoReady ? 5 : 4;
      const layer = L.polyline(ride.path, {
        color: photoReady ? routeColor : routeColorSoft,
        weight: baseWeight,
        opacity: photoReady ? 0.96 : 0.72,
        lineCap: "round",
        lineJoin: "round",
        className: photoReady ? "personal-route-photo-ready" : "personal-route-no-photos",
      }).addTo(map);

      layer.bindTooltip(`${ride.date} - ${ride.distanceKm.toFixed(2)} km`, {
        sticky: true,
        opacity: 0.9,
      });

      if (photoReady) {
        layer.on("click", () => renderRide(detailElement, ride));
        layer.on("mouseover", () => layer.setStyle({ weight: baseWeight + 2 }));
        layer.on("mouseout", () => layer.setStyle({ weight: baseWeight }));
      }
    });

    map.fitBounds(routeBounds.pad(0.08));
    window.setTimeout(() => map.invalidateSize(), 150);
  }

  function initPersonalRides() {
    const detailElement = document.getElementById("ride-detail");
    if (!detailElement) return;

    renderStats();
    renderOverview(detailElement);
    renderRideList(detailElement);
    initMap(detailElement);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPersonalRides);
  } else {
    initPersonalRides();
  }
})();
