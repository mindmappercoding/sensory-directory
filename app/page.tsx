import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  Heart,
  Shield,
  Users,
  CheckCircle,
  Volume2,
  Sun,
  UserCheck,
} from "lucide-react";
import { redirect } from "next/navigation";

async function searchAction(formData: FormData) {
  "use server";
  const query = formData.get("q");
  if (query) {
    redirect(`/venues?q=${encodeURIComponent(query.toString())}`);
  }
  redirect("/venues");
}

export default function Home() {
  return (
    <main className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/20 p-8 sm:p-12 lg:p-16">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Heart className="h-4 w-4" />
            Supporting families with sensory needs
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find sensory-friendly venues for your family
          </h1>

          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Discover calm, inclusive places designed to support children and
            families with sensory processing needs. Search by location, read
            reviews, and share your experiences.
          </p>

          {/* Search Bar */}
          <form action={searchAction} className="mx-auto max-w-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search for venues, activities, or places..."
                  className="h-14 rounded-2xl pl-12 text-base"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 rounded-2xl px-8 text-base"
              >
                Search venues
              </Button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Popular searches:</span>
            <Link
              href="/venues?tags=museum"
              className="rounded-full bg-background px-3 py-1 hover:bg-muted"
            >
              Museums
            </Link>
            <Link
              href="/venues?tags=park"
              className="rounded-full bg-background px-3 py-1 hover:bg-muted"
            >
              Parks
            </Link>
            <Link
              href="/venues?tags=soft-play"
              className="rounded-full bg-background px-3 py-1 hover:bg-muted"
            >
              Soft Play
            </Link>
            <Link
              href="/venues?sensoryHours=true"
              className="rounded-full bg-background px-3 py-1 hover:bg-muted"
            >
              Sensory Hours
            </Link>
          </div>
        </div>

        {/* Decorative gradient blobs */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Why families trust us
          </h2>
          <p className="text-lg text-muted-foreground">
            Built by parents, for parents who understand sensory needs
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-3xl border bg-card p-6 transition hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Volume2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Detailed sensory information
            </h3>
            <p className="text-muted-foreground">
              Get specific details about noise levels, lighting, crowding, and
              more to plan visits with confidence.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-3xl border bg-card p-6 transition hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              Community-driven reviews
            </h3>
            <p className="text-muted-foreground">
              Read honest experiences from other families who understand the
              challenges and celebrate the wins.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-3xl border bg-card p-6 transition hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Verified venues</h3>
            <p className="text-muted-foreground">
              Look for the verified badge to find venues that have been
              confirmed by our team or venue owners.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-3xl border bg-card p-6 transition hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Location-based search</h3>
            <p className="text-muted-foreground">
              Find venues near you using postcode search and see distances to
              plan your journey easily.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-3xl border bg-card p-6 transition hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sun className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Sensory-friendly hours</h3>
            <p className="text-muted-foreground">
              Filter for venues offering dedicated quiet times with reduced
              stimulation for a calmer experience.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-3xl border bg-card p-6 transition hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Trained staff</h3>
            <p className="text-muted-foreground">
              Discover venues where staff are trained in supporting children
              with additional needs and sensory sensitivities.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="rounded-3xl bg-muted/50 p-8 sm:p-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground">
              Finding the right venue has never been easier
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-lg font-semibold">Search & Filter</h3>
              <p className="text-sm text-muted-foreground">
                Use our filters to find venues that match your specific sensory
                requirements and location.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-lg font-semibold">Read Reviews</h3>
              <p className="text-sm text-muted-foreground">
                Check detailed sensory profiles and read experiences from other
                families before you visit.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-lg font-semibold">Share Your Experience</h3>
              <p className="text-sm text-muted-foreground">
                After your visit, leave a review to help other families make
                informed decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-3xl bg-primary p-8 text-center text-primary-foreground sm:p-12 lg:p-16">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Know a great sensory-friendly venue?
          </h2>
          <p className="text-lg opacity-90">
            Help other families by sharing venues you've discovered. Every
            submission makes our community stronger and more helpful.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/submit">
              <Button
                size="lg"
                variant="secondary"
                className="h-14 rounded-2xl px-8 text-base"
              >
                Submit a venue
              </Button>
            </Link>
            <Link href="/venues">
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-2xl border-primary-foreground/20 bg-primary-foreground/10 px-8 text-base text-primary-foreground hover:bg-primary-foreground/20"
              >
                Browse all venues
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-3xl border bg-card p-6 text-center">
          <div className="mb-2 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <div className="text-3xl font-bold">100+</div>
          <div className="text-sm text-muted-foreground">Venues listed</div>
        </div>

        <div className="rounded-3xl border bg-card p-6 text-center">
          <div className="mb-2 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="text-3xl font-bold">500+</div>
          <div className="text-sm text-muted-foreground">Family reviews</div>
        </div>

        <div className="rounded-3xl border bg-card p-6 text-center">
          <div className="mb-2 flex items-center justify-center">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <div className="text-3xl font-bold">1000+</div>
          <div className="text-sm text-muted-foreground">Happy families</div>
        </div>
      </section>
    </main>
  );
}