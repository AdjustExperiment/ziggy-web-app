import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, DollarSign } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20">
            <span className="inline-block w-2 h-2 bg-white rounded-full mr-2"></span>
            Founded 2011
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 font-primary">
            About Ziggy Online Debate
          </h1>
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto font-secondary">
            The Best Online Debate Tournament - Connecting debaters, world-wide.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <Card className="bg-black border-white/10 shadow-card text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-3xl font-bold text-white">2,712+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Total Signups</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10 shadow-card text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto">
                  <DollarSign className="h-6 w-6" />
                </div>
                <CardTitle className="text-3xl font-bold text-white">$2.4M+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Scholarships Awarded</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10 shadow-card text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto">
                  <Trophy className="h-6 w-6" />
                </div>
                <CardTitle className="text-3xl font-bold text-white">2011</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Founded</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 font-primary">
            Our Mission
          </h2>
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed font-secondary">
            We are committed to providing the best online debate tournament experience, connecting debaters from around the world 
            and helping them develop their skills through national competition, affordable pricing, and comprehensive support. 
            Our platform has helped thousands of students improve their debate abilities and earn scholarship opportunities.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;