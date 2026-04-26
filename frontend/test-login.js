const data = { email: 'superadmin@simondu.polri.go.id', password: 'password123' };

fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
.then(res => res.json().then(body => ({ status: res.status, body })))
.then(res => console.log('Response:', res))
.catch(err => console.error('Error:', err));
