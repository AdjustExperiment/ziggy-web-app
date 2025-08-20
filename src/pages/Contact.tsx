import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageCircle, Phone, Clock } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20">
            <span className="inline-block w-2 h-2 bg-white rounded-full mr-2"></span>
            2-Hour Response Time
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 font-primary">
            Contact Us
          </h1>
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto">
            Contact us at any time, via text, email, Google Chat, or Facebook Messenger. 
            We typically respond within 2 hours.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            <Card className="bg-black border-white/10 shadow-card text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto">
                  <Mail className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-primary text-white">Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Send us an email anytime</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10 shadow-card text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto">
                  <Phone className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-primary text-white">Text</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Text us for quick support</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10 shadow-card text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-primary text-white">Google Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Chat with us on Google</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-white/10 shadow-card text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto">
                  <Clock className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-primary text-white">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Typically within 2 hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-black border-white/10 shadow-card">
              <CardHeader>
                <CardTitle className="text-2xl font-primary text-white text-center">
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Name</label>
                    <Input 
                      placeholder="Your name" 
                      className="bg-black/50 border-white/20 text-white placeholder:text-white/70"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Email</label>
                    <Input 
                      type="email" 
                      placeholder="your.email@example.com" 
                      className="bg-black/50 border-white/20 text-white placeholder:text-white/70"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Subject</label>
                  <Input 
                    placeholder="What can we help you with?" 
                    className="bg-black/50 border-white/20 text-white placeholder:text-white/70"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Message</label>
                  <Textarea 
                    placeholder="Tell us more about your question or concern..."
                    rows={6}
                    className="bg-black/50 border-white/20 text-white placeholder:text-white/70"
                  />
                </div>
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;