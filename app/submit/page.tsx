import SubmitVenueForm from "./SubmitVenueForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Submit a venue</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Add a place that feels safe and manageable for sensory needs. Submissions are reviewed before going public.
      </p>

      <div className="mt-6">
        <SubmitVenueForm />
      </div>
    </main>
  );
}
