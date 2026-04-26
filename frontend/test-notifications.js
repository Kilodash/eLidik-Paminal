const data = { email: 'superadmin@simondu.polri.go.id', password: 'password123' };

fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
.then(res => res.json())
.then(auth => {
  if (!auth.token) throw new Error('No token');
  return fetch('http://localhost:3000/api/notifications?unread_only=true', {
    headers: { 'Authorization': `Bearer ${auth.token}` }
  });
})
.then(res => res.json().then(body => ({ status: res.status, body })))
.then(res => console.log('Response:', JSON.stringify(res, null, 2)))
.catch(err => console.error('Error:', err));
