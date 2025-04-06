// worker.js

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const markersData = [
  // Bogotá
  {
    name: "Bogotá - Centro",
    latlng: [4.6097, -74.0817],
    url: "https://co1.contraentrega.co",
    info: "Punto principal en el centro de Bogotá. Abierto Lun-Vie 8am-6pm."
  },
  {
    name: "Bogotá - Chapinero",
    latlng: [4.6486, -74.0628],
    url: "https://co2.contraentrega.co",
    info: "Ubicación en Chapinero. Horario: 9am-7pm."
  },
  {
    name: "Bogotá - Usaquén",
    latlng: [4.6979, -74.0337],
    url: "https://co3.contraentrega.co",
    info: "Punto de recogida en Usaquén. Abierto hasta las 5pm."
  },
  
  // Medellín
  {
    name: "Medellín - El Poblado",
    latlng: [6.2088, -75.5704],
    url: "https://co4.contraentrega.co",
    info: "Zona de El Poblado. Abierto todos los días 10am-8pm."
  },
  {
    name: "Medellín - Laureles",
    latlng: [6.2489, -75.5907],
    url: "https://co5.contraentrega.co",
    info: "Ubicación en Laureles. Horario comercial."
  },
  
  // Cali
  {
    name: "Cali - Norte",
    latlng: [3.4516, -76.5320],
    url: "https://co6.contraentrega.co",
    info: "Zona norte de Cali. Abierto Lun-Vie 8am-6pm."
  },
  
  // Barranquilla
  {
    name: "Barranquilla - Centro",
    latlng: [10.9639, -74.7964],
    url: "https://co7.contraentrega.co",
    info: "Punto principal en el centro. Horario extendido."
  },
  
  // Cartagena
  {
    name: "Cartagena - Bocagrande",
    latlng: [10.3997, -75.5478],
    url: "https://co8.contraentrega.co",
    info: "Ubicación en Bocagrande. Abierto 9am-7pm."
  },
  
  // Otras ciudades
  {
    name: "Bucaramanga - Cabecera",
    latlng: [7.1193, -73.1227],
    url: "https://co9.contraentrega.co",
    info: "Zona Cabecera. Horario Lun-Vie 9am-5pm."
  },
  {
    name: "Pereira - Centro",
    latlng: [4.8133, -75.6961],
    url: "https://co10.contraentrega.co",
    info: "Punto central en Pereira. Horario comercial."
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
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Puntos de Entrega en Colombia</title>
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
    <input type="text" id="search-input" placeholder="Buscar puntos... (nombre, dirección, horario)">
    <div id="search-results"></div>
  </div>
  <div id="controls">
    <button id="redirect-btn" class="control-btn" title="Ir a contraentrega">💬</button>
  </div>
  <div class="zoom-controls">
    <button id="zoom-in" class="zoom-btn" title="Acercar">+</button>
    <button id="zoom-out" class="zoom-btn" title="Alejar">−</button>
  </div>

  <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
  <script>
    // Variables globales
    let map;
    let markerCluster;
    let allMarkers = [];
    let searchTimeout;

    // Límites geográficos de Colombia
    const colombiaBounds = L.latLngBounds(
      L.latLng(-4.23, -81.85), // Esquina suroeste
      L.latLng(16.0, -66.85)   // Esquina noreste
    );

    // Inicializar mapa
    function initMap() {
      map = L.map('map', {
        zoomControl: false,
        maxBounds: colombiaBounds,
        maxBoundsViscosity: 0.75
      }).setView([4.5709, -74.2973], 6); // Vista centrada en Colombia

      // Forzar el mapa a permanecer dentro de los límites
      map.on('drag', function() {
        if (!colombiaBounds.contains(map.getCenter())) {
          map.panInsideBounds(colombiaBounds, { animate: true });
        }
      });

      // Bloquear zoom fuera de los límites
      map.on('zoomend', function() {
        if (map.getZoom() < 5) {
          map.setZoom(5);
        }
      });

      // Capa base del mapa
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        noWrap: true
      }).addTo(map);

      // Inicializar cluster de marcadores
      markerCluster = L.markerClusterGroup();
      map.addLayer(markerCluster);

      // Cargar marcadores
      loadMarkers();

      // Configurar buscador
      setupSearch();

      // Configurar controles
      setupControls();

      // Configurar zoom personalizado
      setupZoomControls();
    }

    // Configurar controles de zoom personalizados
    function setupZoomControls() {
      document.getElementById('zoom-in').addEventListener('click', () => {
        if (map.getZoom() < 18) {
          map.zoomIn();
        }
      });
      document.getElementById('zoom-out').addEventListener('click', () => {
        if (map.getZoom() > 5) {
          map.zoomOut();
        }
      });
    }

    // Cargar marcadores
    async function loadMarkers() {
      try {
        const response = await fetch('/api/markers');
        const markers = await response.json();
        markers.forEach(markerData => {
          // Verificar que las coordenadas estén dentro de los límites
          if (colombiaBounds.contains(markerData.latlng)) {
            const marker = L.marker(markerData.latlng)
              .bindPopup(\`
                <div style="max-width:250px">
                  <h3 style="margin:0 0 5px 0">\${markerData.name}</h3>
                  <p style="margin:0 0 10px 0">\${markerData.info}</p>
                  <a href="\${markerData.url}" target="_blank" style="color:#0066cc">Ver detalles →</a>
                </div>
              \`);

            // Almacenar datos para búsqueda
            marker.searchData = \`\${markerData.name} \${markerData.info} \${markerData.url}\`.toLowerCase();
            marker.data = markerData;
            allMarkers.push(marker);
            markerCluster.addLayer(marker);
          }
        });
      } catch (error) {
        console.error('Error cargando marcadores:', error);
      }
    }

    // Configurar buscador
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

      // Cerrar resultados al hacer clic fuera
      document.addEventListener('click', function(e) {
        if (!e.target.closest('#search-box') && 
            !e.target.closest('.zoom-controls') && 
            e.target.id !== 'zoom-in' && 
            e.target.id !== 'zoom-out') {
          searchResults.style.display = 'none';
        }
      });
    }

    // Mostrar resultados de búsqueda
    function displaySearchResults(results) {
      const searchResults = document.getElementById('search-results');
      searchResults.innerHTML = '';

      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result">No se encontraron resultados</div>';
      } else {
        results.forEach(marker => {
          const resultItem = document.createElement('div');
          resultItem.className = 'search-result';
          resultItem.innerHTML = \`
            <h3>\${marker.data.name}</h3>
            <p>\${marker.data.info.substring(0, 60)}\${marker.data.info.length > 60 ? '...' : ''}</p>
          \`;
          resultItem.addEventListener('click', () => {
            map.setView(marker.getLatLng(), 12);
            marker.openPopup();
            searchResults.style.display = 'none';
          });
          searchResults.appendChild(resultItem);
        });
      }
      searchResults.style.display = 'block';
    }

    // Actualizar marcadores visibles
    function updateVisibleMarkers(results) {
      markerCluster.clearLayers();
      if (results.length > 0) {
        markerCluster.addLayers(results);
        // Ajustar vista para mostrar resultados
        if (results.length === 1) {
          map.setView(results[0].getLatLng(), 12);
        } else {
          const group = new L.featureGroup(results);
          map.fitBounds(group.getBounds().pad(0.1));
        }
      }
    }

    // Restablecer todos los marcadores
    function resetMarkers() {
      markerCluster.clearLayers();
      markerCluster.addLayers(allMarkers);
      map.setView([4.5709, -74.2973], 6);
    }

    // Configurar controles
    function setupControls() {
      // Botón de redirección
      document.getElementById('redirect-btn').addEventListener('click', function() {
        window.open('https://www.facebook.com/groups/546919484352344/?ref=share&mibextid=NSMWBT', '_blank');
      });
    }

    // Redimensionar mapa al cambiar tamaño de ventana
    window.addEventListener('resize', () => {
      map.invalidateSize();
    });

    // Inicializar la aplicación
    document.addEventListener('DOMContentLoaded', initMap);
  </script>
</body>
</html>`;
}