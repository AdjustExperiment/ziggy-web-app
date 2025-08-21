import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, User, ArrowRight, TrendingUp, MessageSquare, Share2 } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "The Evolution of Digital Debate: AI-Powered Analytics Transform Competition Strategy",
    excerpt: "Discover how artificial intelligence is revolutionizing debate analysis, providing real-time insights that enhance performance and strategic thinking in modern tournaments.",
    author: "Dr. Sarah Chen",
    date: "2024-03-15",
    readTime: "8 min read",
    category: "Technology",
    featured: true,
    image: "/api/placeholder/600/300",
    tags: ["AI", "Analytics", "Strategy", "Future"]
  },
  {
    id: 2,
    title: "Breaking Barriers: Virtual Reality Debate Chambers Reshape Remote Competition",
    excerpt: "Step into the future of debate with immersive VR environments that bring competitors together across continents, creating unprecedented opportunities for global participation.",
    author: "Marcus Rodriguez",
    date: "2024-03-12",
    readTime: "6 min read",
    category: "Innovation",
    featured: false,
    image: "/api/placeholder/600/300",
    tags: ["VR", "Remote", "Global", "Innovation"]
  },
  {
    id: 3,
    title: "Neural Network Judging: The Next Frontier in Fair Competition Assessment",
    excerpt: "Explore how machine learning algorithms are being developed to assist judges in maintaining consistency and eliminating bias in debate scoring systems.",
    author: "Dr. Alex Kim",
    date: "2024-03-10",
    readTime: "10 min read",
    category: "Research",
    featured: false,
    image: "/api/placeholder/600/300",
    tags: ["ML", "Judging", "Fairness", "Research"]
  },
  {
    id: 4,
    title: "Quantum Logic Frameworks: Advanced Argument Structures for Tomorrow's Debaters",
    excerpt: "Investigate cutting-edge logical frameworks that leverage quantum computing principles to construct more sophisticated and nuanced argumentative strategies.",
    author: "Prof. Elena Vasquez",
    date: "2024-03-08",
    readTime: "12 min read",
    category: "Theory",
    featured: false,
    image: "/api/placeholder/600/300",
    tags: ["Quantum", "Logic", "Theory", "Advanced"]
  },
  {
    id: 5,
    title: "Holographic Presentation Systems: 3D Visualization in Modern Debate Formats",
    excerpt: "Learn about revolutionary holographic technology that allows debaters to present complex data and arguments through three-dimensional visual representations.",
    author: "Dr. James Wright",
    date: "2024-03-05",
    readTime: "7 min read",
    category: "Technology",
    featured: false,
    image: "/api/placeholder/600/300",
    tags: ["Hologram", "3D", "Presentation", "Future"]
  },
  {
    id: 6,
    title: "Blockchain-Verified Evidence: Ensuring Authenticity in Digital Age Debates",
    excerpt: "Understand how blockchain technology is being implemented to verify the authenticity and integrity of evidence presented in high-stakes debate competitions.",
    author: "Dr. Lisa Park",
    date: "2024-03-03",
    readTime: "9 min read",
    category: "Security",
    featured: false,
    image: "/api/placeholder/600/300",
    tags: ["Blockchain", "Evidence", "Security", "Digital"]
  }
];

const categories = ["All", "Technology", "Innovation", "Research", "Theory", "Security"];

export default function Blog() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950">
      {/* Futuristic Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-transparent"></div>
          <div className="absolute top-20 left-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-400/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-primary font-bold text-white mb-6">
              Future<span className="text-red-500">Blog</span>
            </h1>
            <p className="text-xl md:text-2xl font-secondary text-gray-300 mb-8 max-w-3xl mx-auto">
              Exploring the cutting-edge intersection of technology, artificial intelligence, 
              and the future of competitive debate through advanced research and innovation.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === "All" ? "default" : "outline"}
                  className={`${
                    category === "All" 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "border-red-500/50 text-red-400 hover:bg-red-500/20"
                  } font-secondary`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Post */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        {blogPosts.filter(post => post.featured).map((post) => (
          <div key={post.id} className="relative">
            <Card className="bg-black/50 border-red-500/30 overflow-hidden backdrop-blur-sm">
              <div className="md:flex">
                <div className="md:w-1/2 relative">
                  <div className="h-64 md:h-full bg-gradient-to-br from-red-600/20 to-gray-900/50 flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-16 w-16 text-red-500 mx-auto mb-4" />
                      <p className="text-gray-400 font-secondary">Featured Article Image</p>
                    </div>
                  </div>
                  <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white font-secondary">
                    Featured
                  </Badge>
                </div>
                <div className="md:w-1/2 p-8">
                  <CardHeader className="p-0 mb-4">
                    <Badge variant="outline" className="border-red-500/50 text-red-400 w-fit mb-2 font-secondary">
                      {post.category}
                    </Badge>
                    <CardTitle className="text-3xl font-primary text-white mb-4 leading-tight">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-gray-300 text-lg font-secondary leading-relaxed">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 mb-6">
                    <div className="flex items-center gap-6 text-sm text-gray-400 font-secondary">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {post.readTime}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-0">
                    <Button className="bg-red-500 hover:bg-red-600 text-white font-secondary">
                      Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Blog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.filter(post => !post.featured).map((post) => (
            <Card key={post.id} className="bg-black/30 border-red-500/20 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm group">
              <div className="h-48 bg-gradient-to-br from-red-600/10 to-gray-900/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/70 transition-all duration-300"></div>
                <div className="relative text-center z-10">
                  <MessageSquare className="h-12 w-12 text-red-400 mx-auto mb-2 group-hover:text-red-300 transition-colors" />
                  <p className="text-gray-500 font-secondary text-sm">Article Visual</p>
                </div>
                <Badge className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white font-secondary text-xs">
                  {post.category}
                </Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="text-xl font-primary text-white group-hover:text-red-100 transition-colors leading-tight">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-gray-400 font-secondary line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-red-500/30 text-red-400 text-xs font-secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 font-secondary">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-secondary p-2">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border-red-500/30 font-secondary">
                  Read More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl font-primary font-bold text-white mb-4">
            Stay Connected to the Future
          </h2>
          <p className="text-xl font-secondary text-gray-300 mb-8">
            Subscribe to receive cutting-edge insights on the evolution of debate technology and AI-powered competition analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email..."
              className="flex-1 px-4 py-3 bg-black/50 border border-red-500/30 rounded-lg text-white placeholder:text-gray-400 font-secondary focus:outline-none focus:border-red-500"
            />
            <Button className="bg-red-500 hover:bg-red-600 text-white font-secondary">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}