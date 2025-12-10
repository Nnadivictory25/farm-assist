import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'
import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { data: session } = useSession()

  return (
    <div className="container mx-auto min-h-screen bg-grid h-screen overflow-y-hidden!">
      <nav className="flex justify-between items-center py-5 px-5 lg:px-0 bg-white">
        <Link to="/" className="text-2xl font-extrabold">
          Farm Assist
        </Link>
        <div className="flex items-center gap-2">
          {session ? (
            <Button asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild className="text-base">
              <Link to="/sign-in">Sign In</Link>
            </Button>
          )}
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center mt-5 lg:mt-35 px-5 lg:px-0 ">
        <p className="text-primary font-extrabold tracking-widest text-sm mb-6 opacity-0 animate-fade-in-up [animation-delay:100ms]">
          🌱 FOR SMALLHOLDER FARMERS
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center max-w-4xl leading-tight opacity-0 animate-fade-in-up [animation-delay:200ms]">
          Track Expenses, Harvests & Profits in One Place
        </h1>
        <p className="text-center text-lg text-muted-foreground mt-6 max-w-2xl opacity-0 animate-fade-in-up [animation-delay:300ms]">
          Simple farm record keeping and expense tracking. Record what you
          spend, what you harvest, and what you sell. See your profit instantly.
          Works offline.
        </p>
        <div className="flex gap-4 mt-10 opacity-0 animate-fade-in-up [animation-delay:400ms]">
          <Button asChild size="lg">
            <Link to="/sign-in">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/sign-in">Learn More</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
