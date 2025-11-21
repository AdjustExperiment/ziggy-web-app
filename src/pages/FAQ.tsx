import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    id: "1",
    question: "I'm new to Ziggy – where should I start?",
    answer: "We're glad you're participating! To start with, read these FAQs. Please also click here to view the 'Getting Started' page. It has everything you need to get familiar with what Ziggy is all about and how it works. Read it carefully! Repeated failure to follow the rules, or failure to follow multiple rules, may be grounds for temporary suspension."
  },
  {
    id: "2", 
    question: "I'm totally new to debate – is Ziggy for me?",
    answer: "Absolutely! Ziggy welcomes debaters of all skill levels, from complete beginners to experienced competitors. We provide resources and support to help you learn and improve your debate skills."
  },
  {
    id: "3",
    question: "How do I register for tournaments?",
    answer: "You can register for tournaments through our platform. Navigate to the tournaments page, select the tournament you want to participate in, and follow the registration process. Make sure to register before the deadline."
  },
  {
    id: "4",
    question: "What formats of debate do you support?",
    answer: "We support various debate formats including Public Forum, Lincoln-Douglas, Parliamentary, and Policy debate. Each tournament will specify which format is being used."
  },
  {
    id: "5",
    question: "How do I join a team?",
    answer: "You can join a team by contacting team captains directly or by reaching out to us. We can help match you with teams looking for members in your skill level and location."
  },
  {
    id: "6",
    question: "What are the technical requirements?",
    answer: "You'll need a stable internet connection, a device with a camera and microphone, and access to video conferencing software. We recommend using a computer or tablet for the best experience."
  },
  {
    id: "7",
    question: "How is judging conducted?",
    answer: "Our tournaments use qualified judges who evaluate debates based on argumentation, evidence, refutation, and presentation. Judging criteria are clearly outlined for each tournament format."
  },
  {
    id: "8",
    question: "What if I have technical issues during a debate?",
    answer: "Contact our technical support immediately if you experience issues. We have protocols in place to handle technical difficulties and will work to resolve them quickly to minimize impact on your debate."
  },
  {
    id: "9",
    question: "How do I prepare for my first tournament?",
    answer: "Start by familiarizing yourself with the debate format, research the topic thoroughly, practice your speaking skills, and review our tournament guidelines. We also offer preparation resources and practice sessions."
  },
  {
    id: "10",
    question: "What is the cost to participate?",
    answer: "Tournament entry fees vary by event. Some tournaments are free while others have nominal fees to cover operational costs. All fee information is clearly displayed during registration."
  }
];

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFAQs = faqData.filter(
    faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-hero overflow-x-hidden">
      <main className="relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 font-primary">
              Frequently Asked{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                Questions
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto font-secondary leading-relaxed">
              Need help? Please read through our FAQs before contacting us—you should be able to resolve 90% of your questions through this page!
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 py-4 bg-card/50 border-border text-foreground placeholder:text-muted-foreground text-lg font-secondary focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-4xl mx-auto">
            {filteredFAQs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <AccordionItem 
                    key={faq.id} 
                    value={faq.id}
                    className="bg-card/50 backdrop-blur-sm border-border rounded-lg px-6 hover:bg-card transition-all duration-300"
                  >
                    <AccordionTrigger className="text-card-foreground hover:text-primary text-left text-lg font-medium font-secondary py-6 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-6 text-base leading-relaxed font-secondary">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12">
                <div className="bg-card/50 backdrop-blur-sm border-border rounded-lg p-8 max-w-md mx-auto">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-foreground mb-2 font-secondary">No results found</h3>
                  <p className="text-muted-foreground font-secondary">
                    Try adjusting your search terms or browse all questions above.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="text-center mt-16 pt-12 border-t border-border">
            <h3 className="text-2xl font-bold text-foreground mb-4 font-primary">Still have questions?</h3>
            <p className="text-muted-foreground mb-8 font-secondary">
              If you can't find what you're looking for, we're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/contact" 
                className="bg-primary hover:bg-primary-glow text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-glow font-secondary"
              >
                Contact Support
              </a>
              <a 
                href="mailto:questions@debatechampions.com" 
                className="border border-border hover:border-primary text-foreground hover:text-primary px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 font-secondary"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}