// Service Worker para QRP2P Marketplace
const CACHE_NAME = 'qrp2p-marketplace-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://qrp2p.com/img/P2Pblack.png',
  'https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/css/flag-icon.min.css',
  'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Serif+Pro:wght@400;600&display=swap'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('✅ Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Cache addAll error:', err))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache then network
self.addEventListener('fetch', event => {
  // Handle API requests (don't cache)
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        // Fetch from network
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the fetched resource
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(error => {
          console.error('Fetch error:', error);
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline - Check your connection', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Handle email sending via SendGrid
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SEND_ORDER_EMAIL') {
    event.waitUntil(sendOrderEmail(event.data.orderData));
  }
});

// Function to send order email
async function sendOrderEmail(orderData) {
  try {
    // Configuration - Set these in environment variables or configure here
    const TO_EMAIL = 'fz1@contraentregaco.com';
    const SENDER_EMAIL = 'tutienda@gmail.com'; // Reemplaza con tu correo verificado en SendGrid
    const SENDER_NAME = 'QRP2P Marketplace';
    const SENDGRID_API_KEY = ''; // IMPORTANTE: Configura tu API Key de SendGrid aquí o via entorno
    
    const {
      _subject = 'Nuevo Pedido - QRP2P Marketplace',
      customerDetails = {},
      itemsDetails = [],
      orderSummary = {},
    } = orderData;
    
    // Generate HTML email content
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo Pedido QRP2P</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1a7f6b;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #1a7f6b;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            color: #666;
            margin: 5px 0 0;
          }
          h2 {
            color: #1a7f6b;
            font-size: 18px;
            margin-top: 20px;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 5px;
          }
          p {
            color: #495057;
            font-size: 14px;
            margin: 5px 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f1f3f5;
          }
          .item-name {
            flex: 2;
            font-weight: 500;
          }
          .item-quantity, .item-price, .item-subtotal {
            flex: 1;
            text-align: right;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 14px;
          }
          .summary-row.total {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #dee2e6;
            padding-top: 10px;
            margin-top: 10px;
            color: #1a7f6b;
          }
          .verified-badge {
            display: inline-block;
            background: #2ecc71;
            color: white;
            font-size: 0.7rem;
            padding: 2px 8px;
            border-radius: 20px;
            margin-left: 8px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #868e96;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>QRP2P Marketplace <span class="verified-badge">VERIFIED</span></h1>
            <p>Global P2P Trading Platform</p>
          </div>
          
          <h2>📋 ${_subject}</h2>
          
          <h2>👤 Información del Cliente</h2>
          <p><strong>Nombre:</strong> ${customerDetails.name || 'No proporcionado'}</p>
          <p><strong>Teléfono:</strong> ${customerDetails.phone || 'No proporcionado'}</p>
          <p><strong>Email:</strong> ${customerDetails.email || 'No proporcionado'}</p>
          <p><strong>Dirección:</strong> ${customerDetails.address || 'No proporcionado'}</p>
          ${customerDetails.city ? `<p><strong>Ciudad:</strong> ${customerDetails.city}</p>` : ''}
          ${customerDetails.country ? `<p><strong>País:</strong> ${customerDetails.country}</p>` : ''}
          
          <h2>🛒 Ítems del Pedido</h2>
          ${
            itemsDetails.length > 0
              ? `<div class="item-row">
                  <span class="item-name"><strong>Producto</strong></span>
                  <span class="item-quantity"><strong>Cant.</strong></span>
                  <span class="item-price"><strong>Precio</strong></span>
                  <span class="item-subtotal"><strong>Subtotal</strong></span>
                </div>
                ${itemsDetails.map(item => `
                  <div class="item-row">
                    <span class="item-name">${item.name || 'No especificado'}</span>
                    <span class="item-quantity">x${item.quantity || 0}</span>
                    <span class="item-price">$${Number(item.price || 0).toLocaleString('es-CO')}</span>
                    <span class="item-subtotal">$${Number(item.subtotal || 0).toLocaleString('es-CO')}</span>
                  </div>
                `).join('')}`
              : '<p>No se proporcionaron detalles de los ítems</p>'
          }
          
          <h2>💰 Resumen del Pedido</h2>
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${Number(orderSummary.subtotal || 0).toLocaleString('es-CO')}</span>
          </div>
          <div class="summary-row">
            <span>Costo de envío:</span>
            <span>$${Number(orderSummary.deliveryFee || 0).toLocaleString('es-CO')}</span>
          </div>
          <div class="summary-row total">
            <span>Total:</span>
            <span>$${Number(orderSummary.total || 0).toLocaleString('es-CO')}</span>
          </div>
          <div class="summary-row">
            <span>Método de pago:</span>
            <span>${orderSummary.paymentMethod || 'No especificado'}</span>
          </div>
          <div class="summary-row">
            <span>ID del pedido:</span>
            <span><strong>${orderSummary.orderId || 'No proporcionado'}</strong></span>
          </div>
          ${orderSummary.notes ? `
          <div class="summary-row">
            <span>Notas adicionales:</span>
            <span>${orderSummary.notes}</span>
          </div>` : ''}
          
          <div class="footer">
            <p><strong>QRP2P Marketplace</strong> - Global P2P Trading Platform</p>
            <p>Verified Buyers & Sellers | Secure Transactions | Global Reach</p>
            <p>Este es un correo automático, por favor no responder directamente.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Plain text version for email clients that don't support HTML
    const emailText = `
      ${_subject}
      
      INFORMACIÓN DEL CLIENTE:
      Nombre: ${customerDetails.name || 'No proporcionado'}
      Teléfono: ${customerDetails.phone || 'No proporcionado'}
      Email: ${customerDetails.email || 'No proporcionado'}
      Dirección: ${customerDetails.address || 'No proporcionado'}
      
      ÍTEMS DEL PEDIDO:
      ${itemsDetails.map(item => `${item.name} - x${item.quantity} - $${item.price} = $${item.subtotal}`).join('\n')}
      
      RESUMEN:
      Subtotal: $${orderSummary.subtotal}
      Envío: $${orderSummary.deliveryFee}
      TOTAL: $${orderSummary.total}
      Método de pago: ${orderSummary.paymentMethod}
      ID del pedido: ${orderSummary.orderId}
      
      ---
      QRP2P Marketplace - Global P2P Trading Platform
    `;
    
    // Prepare email payload for SendGrid
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: TO_EMAIL }],
        },
      ],
      from: {
        email: SENDER_EMAIL,
        name: SENDER_NAME,
      },
      reply_to: {
        email: customerDetails.email || SENDER_EMAIL,
        name: customerDetails.name || SENDER_NAME,
      },
      subject: `${_subject} - ${orderSummary.orderId || 'Nuevo Pedido'}`,
      content: [
        {
          type: 'text/html',
          value: emailHtml,
        },
        {
          type: 'text/plain',
          value: emailText,
        },
      ],
    };
    
    // Check if API key is configured
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API Key not configured');
      // Send error notification to client
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'EMAIL_ERROR',
          error: 'SendGrid API Key not configured'
        });
      });
      return;
    }
    
    // Send email via SendGrid API
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });
    
    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      throw new Error(`SendGrid error (${sendGridResponse.status}): ${errorText}`);
    }
    
    console.log('✅ Email sent successfully');
    
    // Notify client of success
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'EMAIL_SUCCESS',
        orderId: orderSummary.orderId
      });
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Notify client of error
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'EMAIL_ERROR',
        error: error.message
      });
    });
  }
}

// Handle push notifications (optional)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update from QRP2P Marketplace',
    icon: 'https://qrp2p.com/img/P2Pblack.png',
    badge: 'https://qrp2p.com/img/P2Pblack.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Marketplace',
        icon: 'https://qrp2p.com/img/P2Pblack.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: 'https://qrp2p.com/img/P2Pblack.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('QRP2P Marketplace', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
