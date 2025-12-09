import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LazyImage } from '@/components/LazyImage';
import { supabase } from '@/integrations/supabase/client';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  MessageCircle,
  Mail,
  MapPin,
  Phone,
  ExternalLink
} from 'lucide-react';

interface FooterUpdate {
  title: string;
  content: string;
  link_url: string;
  link_text: string;
}

export function Footer() {
  const [footerUpdate, setFooterUpdate] = useState<FooterUpdate>({
    title: 'Latest Update',
    content: 'Spring 2024 registration is now open! Join hundreds of debaters competing nationally.',
    link_url: '/tournaments',
    link_text: 'Register Now'
  });

  useEffect(() => {
    loadFooterContent();
    
    // Listen for updates from the admin panel
    const handleFooterUpdate = (event: CustomEvent) => {
      setFooterUpdate(event.detail);
    };
    
    window.addEventListener('footerContentUpdated', handleFooterUpdate as EventListener);
    
    return () => {
      window.removeEventListener('footerContentUpdated', handleFooterUpdate as EventListener);
    };
  }, []);

  const loadFooterContent = async () => {
    try {
      // For now, using localStorage as a fallback until proper database schema is set up
      const stored = localStorage.getItem('footer_latest_update');
      if (stored) {
        const content = JSON.parse(stored);
        setFooterUpdate(content);
      }
    } catch (error) {
      console.error('Error loading footer content:', error);
    }
  };

  const socialLinks = [
    { 
      name: 'Facebook', 
      icon: Facebook, 
      url: 'https://facebook.com/ZiggyOnlineDebate',
      color: 'hover:text-blue-400'
    },
    { 
      name: 'Twitter', 
      icon: Twitter, 
      url: 'https://twitter.com/ZiggyDebate',
      color: 'hover:text-blue-400'
    },
    { 
      name: 'Instagram', 
      icon: Instagram, 
      url: 'https://instagram.com/ziggyonlinedebate',
      color: 'hover:text-pink-400'
    },
    { 
      name: 'YouTube', 
      icon: Youtube, 
      url: 'https://youtube.com/@ZiggyOnlineDebate',
      color: 'hover:text-red-400'
    },
    { 
      name: 'Discord', 
      icon: MessageCircle, 
      url: 'https://discord.gg/ziggyonlinedebate',
      color: 'hover:text-purple-400'
    }
  ];

  const quickLinks = [
    { name: 'About Us', url: '/about' },
    { name: 'Getting Started', url: '/getting-started' },
    { name: 'FAQ', url: '/faq' },
    { name: 'Contact', url: '/contact' },
    { name: 'Blog', url: '/blog' }
  ];

  const competitionLinks = [
    { name: 'Tournaments', url: '/tournaments' },
    { name: 'Results', url: '/results' },
    { name: 'Host a Tournament', url: '/host-tournament' },
    { name: 'Sign Up', url: '/signup' },
    { name: 'Sign In', url: '/login' }
  ];

  return (
    <footer className="bg-card border-t border-primary/20 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <LazyImage 
                src="/lovable-uploads/760b99f2-12c5-4e29-8b02-5d93d41f41a9.png" 
                alt="Ziggy Online Debate" 
                className="h-10 w-10 rounded-full border-2 border-primary" 
              />
              <span className="text-xl font-bold text-card-foreground font-primary">
                Ziggy Online Debate™
              </span>
            </Link>
            
            <p className="text-muted-foreground mb-6 text-sm leading-relaxed font-secondary">
              Your all-in-one online debate tournament host and resource provider, 
              connecting debaters worldwide since 2011.
            </p>

            <Badge className="bg-primary/10 text-primary border-primary/30 mb-4">
              <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
              Running Since 2011
            </Badge>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>contact@ziggyonlinedebate.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>(555) 123-ZIGGY</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-card-foreground font-semibold text-lg mb-4 font-primary">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.url}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-secondary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Competition */}
          <div>
            <h3 className="text-card-foreground font-semibold text-lg mb-4 font-primary">Competition</h3>
            <ul className="space-y-2">
              {competitionLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.url}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-secondary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media & Recent Updates */}
          <div>
            <h3 className="text-card-foreground font-semibold text-lg mb-4 font-primary">Connect With Us</h3>
            
            {/* Social Links */}
            <div className="flex space-x-3 mb-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={`Follow us on ${social.name}`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>

            {/* Recent Activity Card */}
            <Card className="bg-primary/10 border-primary/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <h4 className="text-card-foreground font-medium mb-2 text-sm">{footerUpdate.title}</h4>
                <p className="text-muted-foreground text-xs mb-2">
                  {footerUpdate.content}
                </p>
                <a 
                  href={footerUpdate.link_url} 
                  className="inline-flex items-center text-primary hover:text-primary/80 text-xs font-medium"
                >
                  {footerUpdate.link_text} <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary/20 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-muted-foreground text-sm font-secondary">
            © {new Date().getFullYear()} Ziggy Online Debate™. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Link 
              to="/privacy" 
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/rules" 
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              Rules
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}