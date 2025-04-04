// worker.js - AUSTRIA

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const markersData = [
  {
    name: "Wien - Zentrum",
    latlng: [48.2082, 16.3738],
    url: "https://at1.contraentrega.at",
    info: "Hauptbüro am Stephansplatz. Öffnungszeiten: 8:00-18:00 (MEZ)"
  },
  {
    name: "Graz - Hauptplatz",
    latlng: [47.0707, 15.4395],
    url: "https://at2.contraentrega.at",
    info: "Zentrale Lage in der Altstadt. Samstags bis 15:00"
  },
  {
    name: "Salzburg - Altstadt",
    latlng: [47.8006, 13.0452],
    url: "https://at3.contraentrega.at",
    info: "Nah am Mozartplatz. Touristen-Service bis 19:00"
  },
  {
    name: "Innsbruck - Maria-Theresien-Straße",
    latlng: [47.2654, 11.3928],
    url: "https://at4.contraentrega.at",
    info: "In den Alpen. Wintersaison: 7:30-20:00"
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
  return new Response('Nicht gefunden', { status: 404 });
}

function generateHTML() {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lieferstellen in Österreich</title>
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
    <input type="text" id="search-input" placeholder="Standorte suchen... (Name, Adresse, Öffnungszeiten)">
    <div id="search-results"></div>
  </div>
  <div id="controls">
    <button id="redirect-btn" class="control-btn" title="Zur Hauptseite">📍</button>
  </div>
  <div class="zoom-controls">
    <button id="zoom-in" class="zoom-btn" title="Vergrößern">+</button>
    <button id="zoom-out" class="zoom-btn" title="Verkleinern">−</button>
  </div>

  <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
  <script>
    // Globale Variablen
    let map;
    let markerCluster;
    let allMarkers = [];
    let searchTimeout;

    // Geografische Grenzen Österreichs
    const austriaBounds = L.latLngBounds(
      L.latLng(46.3723, 9.5307),  // SW
      L.latLng(49.0205, 17.1607)   // NE
    );

    // Karte initialisieren
    function initMap() {
      map = L.map('map', {
        zoomControl: false,
        maxBounds: austriaBounds,
        maxBoundsViscosity: 0.75
      }).setView([47.5162, 14.5501], 7);  // Zentriert auf Österreich

      // Karte innerhalb der Grenzen halten
      map.on('drag', function() {
        if (!austriaBounds.contains(map.getCenter())) {
          map.panInsideBounds(austriaBounds, { animate: true });
        }
      });

      // Zoom begrenzen
      map.on('zoomend', function() {
        if (map.getZoom() < 7) {
          map.setZoom(7);
        }
      });

      // Basiskarte
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap Mitwirkende',
        noWrap: true
      }).addTo(map);

      // Marker-Cluster initialisieren
      markerCluster = L.markerClusterGroup();
      map.addLayer(markerCluster);

      // Marker laden
      loadMarkers();

      // Suche einrichten
      setupSearch();

      // Steuerelemente einrichten
      setupControls();

      // Zoom-Steuerelemente einrichten
      setupZoomControls();
    }

    // Zoom-Steuerelemente
    function setupZoomControls() {
      document.getElementById('zoom-in').addEventListener('click', () => {
        if (map.getZoom() < 18) {
          map.zoomIn();
        }
      });
      document.getElementById('zoom-out').addEventListener('click', () => {
        if (map.getZoom() > 7) {
          map.zoomOut();
        }
      });
    }

    // Marker laden
    async function loadMarkers() {
      try {
        const response = await fetch('/api/markers');
        const markers = await response.json();
        markers.forEach(markerData => {
          // Koordinaten innerhalb der Grenzen überprüfen
          if (austriaBounds.contains(markerData.latlng)) {
            const marker = L.marker(markerData.latlng)
              .bindPopup(\`
                <div style="max-width:250px">
                  <h3 style="margin:0 0 5px 0">\${markerData.name}</h3>
                  <p style="margin:0 0 10px 0">\${markerData.info}</p>
                  <a href="\${markerData.url}" target="_blank" style="color:#0066cc">Details anzeigen →</a>
                </div>
              \`);

            // Daten für Suche speichern
            marker.searchData = \`\${markerData.name} \${markerData.info} \${markerData.url}\`.toLowerCase();
            marker.data = markerData;
            allMarkers.push(marker);
            markerCluster.addLayer(marker);
          }
        });
      } catch (error) {
        console.error('Fehler beim Laden der Marker:', error);
      }
    }

    // Suche einrichten
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

      // Ergebnisse schließen bei Klick außerhalb
      document.addEventListener('click', function(e) {
        if (!e.target.closest('#search-box') && 
            !e.target.closest('.zoom-controls') && 
            e.target.id !== 'zoom-in' && 
            e.target.id !== 'zoom-out') {
          searchResults.style.display = 'none';
        }
      });
    }

    // Suchergebnisse anzeigen
    function displaySearchResults(results) {
      const searchResults = document.getElementById('search-results');
      searchResults.innerHTML = '';

      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result">Keine Ergebnisse gefunden</div>';
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

    // Sichtbare Marker aktualisieren
    function updateVisibleMarkers(results) {
      markerCluster.clearLayers();
      if (results.length > 0) {
        markerCluster.addLayers(results);
        // Ansicht anpassen für Ergebnisse
        if (results.length === 1) {
          map.setView(results[0].getLatLng(), 14);
        } else {
          const group = new L.featureGroup(results);
          map.fitBounds(group.getBounds().pad(0.1));
        }
      }
    }

    // Alle Marker zurücksetzen
    function resetMarkers() {
      markerCluster.clearLayers();
      markerCluster.addLayers(allMarkers);
      map.setView([47.5162, 14.5501], 7);
    }

    // Steuerelemente einrichten
    function setupControls() {
      // Weiterleitungs-Button
      document.getElementById('redirect-btn').addEventListener('click', function() {
        window.open('https://fz.contraentregaco.com', '_blank');
      });
    }

    // Karte bei Fensteränderung anpassen
    window.addEventListener('resize', () => {
      map.invalidateSize();
    });

    // App initialisieren
    document.addEventListener('DOMContentLoaded', initMap);
  </script>
</body>
</html>`;
}