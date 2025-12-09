import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageCircle, Clock, Send, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Contact configuration - easily editable
const CONTACT_CONFIG = {
  email: "contact@ziggyonlinedebate.com",
  googleChat: "ziggyonlinedebate@chat.google.com",
  messenger: "https://m.me/ziggyonlinedebate",
  responseTime: "2 hours",
};

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Store contact submission in database (using type assertion until types regenerate)
      const { error } = await (supabase as any)
        .from("contact_submissions")
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject || null,
          message: formData.message,
        });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 2 hours.",
      });

      // Reset form
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      // Fallback: open mailto link
      const mailtoUrl = `mailto:${CONTACT_CONFIG.email}?subject=${encodeURIComponent(
        formData.subject || "Contact Form Submission"
      )}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
      )}`;
      window.open(mailtoUrl, "_blank");
      
      toast({
        title: "Opening email client",
        description: "Your email app will open to send the message.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      description: "Send us an email anytime",
      action: `mailto:${CONTACT_CONFIG.email}`,
      actionLabel: CONTACT_CONFIG.email,
    },
    {
      icon: MessageCircle,
      title: "Google Chat",
      description: "Chat with us on Google",
      action: `https://chat.google.com/dm/${CONTACT_CONFIG.googleChat}`,
      actionLabel: "Open Chat",
      external: true,
    },
    {
      icon: MessageCircle,
      title: "Messenger",
      description: "Message us on Facebook",
      action: CONTACT_CONFIG.messenger,
      actionLabel: "Open Messenger",
      external: true,
    },
    {
      icon: Clock,
      title: "Response Time",
      description: `Typically within ${CONTACT_CONFIG.responseTime}`,
      actionLabel: "Fast response guaranteed",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-border hover:bg-primary/20">
            <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
            {CONTACT_CONFIG.responseTime} Response Time
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-primary">
            Contact Us
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-secondary">
            Reach out via text, email, Google Chat, or Facebook Messenger.
            We typically respond within {CONTACT_CONFIG.responseTime}.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            {contactMethods.map((method) => (
              <Card 
                key={method.title} 
                className="bg-card border-border shadow-card text-center hover:shadow-lg transition-shadow group"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 mx-auto group-hover:bg-primary/20 transition-colors">
                    <method.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-primary text-card-foreground">
                    {method.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">{method.description}</p>
                  {method.action ? (
                    <a
                      href={method.action}
                      target={method.external ? "_blank" : undefined}
                      rel={method.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                    >
                      {method.actionLabel}
                      {method.external && <ExternalLink className="h-3 w-3" />}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-foreground">
                      {method.actionLabel}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-2xl font-primary text-card-foreground text-center">
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Email <span className="text-destructive">*</span>
                      </label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Subject
                    </label>
                    <Input
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What can we help you with?"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Message <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us more about your question or concern..."
                      rows={6}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-secondary"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
