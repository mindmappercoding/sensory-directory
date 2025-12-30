async function getVenues() {
  const res = await fetch("http://localhost:3000/api/venues", { cache: "no-store" });
  return res.json();
}

export default async function VenuesPage() {
  const data = await getVenues();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Venues</h1>

      <pre className="mt-4 rounded-md border p-4 text-sm overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
