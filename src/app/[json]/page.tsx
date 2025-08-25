export default async function JsonView() {
  const response = await fetch('http://localhost:3000/api/transactions/by-mouth', {
    cache: 'no-store',
  });
  const data = await response.json();

  return (
    <main>
      <h1>JSON Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}
