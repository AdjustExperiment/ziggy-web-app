import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description?: string;
  icon?: React.ReactNode;
}

export function KPICard({ title, value, change, trend, description, icon }: KPICardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  const trendColor = trend === "up" ? "text-green-600" : "text-red-600";
  const trendBg = trend === "up" ? "bg-green-50" : "bg-red-50";

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-tournament transition-smooth group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/70">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold text-white">{value}</div>
          
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trendBg}`}>
              <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {change}
              </span>
            </div>
            
            <ArrowRight className="h-4 w-4 text-white/70 group-hover:text-primary transition-smooth" />
          </div>
          
          {description && (
            <p className="text-xs text-white/70">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}