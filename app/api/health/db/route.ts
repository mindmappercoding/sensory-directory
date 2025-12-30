import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const collections = (await db.listCollections().toArray()).map(c => c.name);

  return Response.json({ ok: true, db: db.databaseName, collections });
}
