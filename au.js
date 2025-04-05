// worker.js - AUSTRALIA

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const markersData = [
  {
    name: "Sydney - CBD",
    latlng: [-33.8688, 151.2093],
    url: "https://au1.contraentrega.com.au",
    info: "Main office in Central Business District. Hours: 8am-6pm (AEST)"
  },
  {
    name: "Melbourne - Downtown",
    latlng: [-37.8136, 144.9631],
    url: "https://au2.contraentrega.com.au",
    info: "Flinders Street location. Open until 7pm weekdays"
  },
  {
    name: "Brisbane - South Bank",
    latlng: [-27.4698, 153.0251],
    url: "https://au3.contraentrega.com.au",
    info: "Cultural precinct location. Weekends: 9am-5pm"
  },
  {
    name: "Perth - West Coast",
    latlng: [-31.9505, 115.8605],
    url: "https://au4.contraentrega.com.au",
    info: "Serving Western Australia. Extended hours in summer"
  }
];

async function handleRequest(request) {
  const url = new URL(request.url);
  if (url.pathname === '/') {
    return new Response(generateHTML(), {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
  if (url.pathname === '/api/markers') {
    return new Response(JSON.stringify(markersData), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }
  return new Response('Not Found', { status: 404 });
}

function generateHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delivery Points in Australia</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
  <style>
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: Arial, sans-serif;
    }
    #map {
      width: 100%;
      height: 100vh;
    }
    #search-box {
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 1000;
      width: 300px;
      background: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    #search-input {
      width: 100%;
      padding: 10px 15px;
      border: 2px solid #ddd;
      border-radius: 20px;
      font-size: 14px;
      outline: none;
    }
    #search-results {
      margin-top: 10px;
      max-height: 300px;
      overflow-y: auto;
      display: none;
      background: white;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .search-result {
      padding: 10px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
    }
    .search-result:hover {
      background-color: #f5f5f5;
    }
    .search-result h3 {
      margin: 0 0 5px 0;
      font-size: 14px;
      color: #333;
    }
    .search-result p {
      margin: 0;
      font-size: 12px;
      color: #666;
    }
    #controls {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .control-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .zoom-controls {
      display: flex;
      flex-direction: column;
      gap: 5px;
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }
    .zoom-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .marker-cluster-small {
      background-color: rgba(110, 204, 57, 0.6);
    }
    .marker-cluster-medium {
      background-color: rgba(240, 194, 12, 0.6);
    }
    .marker-cluster-large {
      background-color: rgba(241, 128, 23, 0.6);
    }
    @media (max-width: 768px) {
      #search-box {
        width: calc(100% - 40px);
        top: 10px;
        left: 10px;
      }
      #controls {
        top: 70px;
        right: 10px;
      }
      .zoom-controls {
        bottom: 10px;
        right: 10px;
      }
      .leaflet-popup-content {
        width: 250px !important;
      }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="search-box">
    <input type="text" id="search-input" placeholder="Search points... (name, location, hours)">
    <div id="search-results"></div>
  </div>
  <div id="controls">
    <button id="redirect-btn" class="control-btn" title="Go to main site">📍</button>
  </div>
  <div class="zoom-controls">
    <button id="zoom-in" class="zoom-btn" title="Zoom in">+</button>
    <button id="zoom-out" class="zoom-btn" title="Zoom out">−</button>
  </div>

  <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
  <script>
    // Global variables
    let map;
    let markerCluster;
    let allMarkers = [];
    let searchTimeout;

    // Australia geographical bounds
    const australiaBounds = L.latLngBounds(
      L.latLng(-44, 112), // SW
      L.latLng(-10, 154)  // NE
    );

    // Initialize map
    function initMap() {
      map = L.map('map', {
        zoomControl: false,
        maxBounds: australiaBounds,
        maxBoundsViscosity: 0.75
      }).setView([-25.2744, 133.7751], 4); // Centered on Australia

      // Keep map within bounds
      map.on('drag', function() {
        if (!australiaBounds.contains(map.getCenter())) {
          map.panInsideBounds(australiaBounds, { animate: true });
        }
      });

      // Limit zoom
      map.on('zoomend', function() {
        if (map.getZoom() < 4) {
          map.setZoom(4);
        }
      });

      // Base map layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        noWrap: true
      }).addTo(map);

      // Initialize marker cluster
      markerCluster = L.markerClusterGroup();
      map.addLayer(markerCluster);

      // Load markers
      loadMarkers();

      // Setup search
      setupSearch();

      // Setup controls
      setupControls();

      // Setup custom zoom controls
      setupZoomControls();
    }

    // Custom zoom controls
    function setupZoomControls() {
      document.getElementById('zoom-in').addEventListener('click', () => {
        if (map.getZoom() < 18) {
          map.zoomIn();
        }
      });
      document.getElementById('zoom-out').addEventListener('click', () => {
        if (map.getZoom() > 4) {
          map.zoomOut();
        }
      });
    }

    // Load markers
    async function loadMarkers() {
      try {
        const response = await fetch('/api/markers');
        const markers = await response.json();
        markers.forEach(markerData => {
          // Verify coordinates are within bounds
          if (australiaBounds.contains(markerData.latlng)) {
            const marker = L.marker(markerData.latlng)
              .bindPopup(\`
                <div style="max-width:250px">
                  <h3 style="margin:0 0 5px 0">\${markerData.name}</h3>
                  <p style="margin:0 0 10px 0">\${markerData.info}</p>
                  <a href="\${markerData.url}" target="_blank" style="color:#0066cc">View details →</a>
                </div>
              \`);

            // Store data for search
            marker.searchData = \`\${markerData.name} \${markerData.info} \${markerData.url}\`.toLowerCase();
            marker.data = markerData;
            allMarkers.push(marker);
            markerCluster.addLayer(marker);
          }
        });
      } catch (error) {
        console.error('Error loading markers:', error);
      }
    }

    // Setup search
    function setupSearch() {
      const searchInput = document.getElementById('search-input');
      const searchResults = document.getElementById('search-results');
      
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const query = this.value.trim().toLowerCase();
          if (query.length === 0) {
            searchResults.style.display = 'none';
            resetMarkers();
            return;
          }

          const results = allMarkers.filter(marker => 
            marker.searchData.includes(query)
          );
          displaySearchResults(results);
          updateVisibleMarkers(results);
        }, 300);
      });

      // Close results when clicking outside
      document.addEventListener('click', function(e) {
        if (!e.target.closest('#search-box') && 
            !e.target.closest('.zoom-controls') && 
            e.target.id !== 'zoom-in' && 
            e.target.id !== 'zoom-out') {
          searchResults.style.display = 'none';
        }
      });
    }

    // Display search results
    function displaySearchResults(results) {
      const searchResults = document.getElementById('search-results');
      searchResults.innerHTML = '';

      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result">No results found</div>';
      } else {
        results.forEach(marker => {
          const resultItem = document.createElement('div');
          resultItem.className = 'search-result';
          resultItem.innerHTML = \`
            <h3>\${marker.data.name}</h3>
            <p>\${marker.data.info.substring(0, 60)}\${marker.data.info.length > 60 ? '...' : ''}</p>
          \`;
          resultItem.addEventListener('click', () => {
            map.setView(marker.getLatLng(), 14);
            marker.openPopup();
            searchResults.style.display = 'none';
          });
          searchResults.appendChild(resultItem);
        });
      }
      searchResults.style.display = 'block';
    }

    // Update visible markers
    function updateVisibleMarkers(results) {
      markerCluster.clearLayers();
      if (results.length > 0) {
        markerCluster.addLayers(results);
        // Adjust view to show results
        if (results.length === 1) {
          map.setView(results[0].getLatLng(), 14);
        } else {
          const group = new L.featureGroup(results);
          map.fitBounds(group.getBounds().pad(0.1));
        }
      }
    }

    // Reset all markers
    function resetMarkers() {
      markerCluster.clearLayers();
      markerCluster.addLayers(allMarkers);
      map.setView([-25.2744, 133.7751], 4);
    }

    // Setup controls
    function setupControls() {
      // Redirect button
      document.getElementById('redirect-btn').addEventListener('click', function() {
        window.open('https://fz.contraentregaco.com', '_blank');
      });
    }

    // Resize map on window resize
    window.addEventListener('resize', () => {
      map.invalidateSize();
    });

    // Initialize app
    document.addEventListener('DOMContentLoaded', initMap);
  </script>
</body>
</html>`;
}