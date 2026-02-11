import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionFX } from "@/components/SectionFX";

const testimonials = [
  {
    quote: "I'm going into my third year of competition and Ziggy was one of the best decisions I made to help prepare myself. It gave me a national perspective as each region is different in its own way. I watched my speaking and communication abilities begin to develop as I got more and more practice through these debates. Being able to choose when your round happens in the week + time span you're given is a huge plus. You also get to meet other debaters across the nation. Ziggy is one of the best decisions you could make for getting debate practice.",
    author: "Zoe Abbott",
    role: "COMPETITOR"
  },
  {
    quote: "I am grateful for Ziggy because it gives you a ton of practice with arguments from all over the nation to different judge perspectives to communication skills. if you have a small debate club then Ziggy should be a top investment for you because then you won't have to debate the same club members 24/7. Highly recommend!",
    author: "Kaylee Dodson",
    role: "competitor"
  },
  {
    quote: "Ziggy is a necessity for any debater. The ability to practice your rounds online, both before and during the season, allows debaters to develop their arguments in a way that would be otherwise impossible, and gives those who use it a pronounced competitive edge. On a personal level, I credit much of my success to honing my skills in Ziggy tournaments. The tournament platform is easy-to-use, the staff is helpful, and the experience is unparalleled. 11/10",
    author: "Nathan Spencer",
    role: "competitor"
  },
  {
    quote: "In my opinion, Ziggy is one of the best ways to improve your debate skills. The weekly practice rounds have helped me encounter new arguments and cases, and has helped me become more familiar with the resolutions (which is really great for new debaters!). On top of that, Ziggy's staff has been incredibly kind and helpful, and they've done some really fun events! Overall, I would highly recommend Ziggy to anyone seeking to improve their debate skills as well as those looking to make new friends!",
    author: "Jonah Lang",
    role: "competitor"
  },
  {
    quote: "'Try, try, try again. And when after that you fall and fail, try one more time.' This is advice that I've received time and time again. This powerful advice is exactly why Ziggy means so much to me. Ziggy enabled me to have well over 150 practice rounds. In the fall of 2020, I decided to sign up for 6 different Ziggy rounds per week — I loved to debate, and I really wanted to improve and get better, even when I failed in rounds. Near the end of my high school debate career, Ziggy paid off 1000%. I placed 4th at the 2021 NCFCA nationals — only because of the immense amount of practice rounds I had been able to achieve in the time before. Ziggy allowed me to test out new case ideas, receive tons of feedback from judges, and even get closer to the partner that brought us both to 4th at nats. I will forever be grateful to Ziggy and Isaac Sommers for creating this wonderful platform.",
    author: "Justin Marwad",
    role: "competitor",
    highlight: "4th at 2021 NCFCA Nationals"
  }
];

const Testimonials = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="relative">
        <SectionFX variant="accent" intensity="medium" />
        
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Badge className="mb-6 bg-primary/10 text-primary border-border hover:bg-primary/20">
              <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
              Real Success Stories
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-primary">
              What Our Debaters Say
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-secondary">
              Real testimonials from competitors who have experienced success with Ziggy Online Debate. 
              See how our platform has helped debaters improve their skills and achieve their goals.
            </p>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="relative py-16">
          <SectionFX variant="muted" intensity="low" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className={`glass-card ${testimonial.highlight ? 'lg:col-span-3 md:col-span-2' : ''}`}>
                  <CardContent className="p-6">
                    {testimonial.highlight && (
                      <Badge className="bg-primary/10 text-primary border-border mb-4">
                        {testimonial.highlight}
                      </Badge>
                    )}
                    <blockquote className="text-muted-foreground mb-6 italic leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm mr-3">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-card-foreground font-medium">{testimonial.author}</p>
                        <p className="text-muted-foreground text-sm capitalize">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Testimonials;