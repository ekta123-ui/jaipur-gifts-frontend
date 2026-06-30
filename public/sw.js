self.addEventListener('push', (event) => {
    let data = { title: 'New Alert', body: 'You have a new update from Jaipur Gifts.' };
    
    try {
        data = event.data.json();
    } catch (e) {
        console.log('Push event received but no JSON payload found.');
    }

    const options = {
        body: data.body,
        icon: '/images/logo.png', // Ensure this path is correct
        badge: '/images/logo.png',
        data: { url: data.url || '/admin' }
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});