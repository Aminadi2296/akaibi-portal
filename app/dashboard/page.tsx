export default function DashboardPage() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Employee Dashboard</h1>
      <p>Welcome! You're logged in.</p>
      <a href="/upload">
        <button style={{ padding: '8px 16px', marginTop: 20 }}>Upload a Document</button>
      </a>
    </main>
  );
}
