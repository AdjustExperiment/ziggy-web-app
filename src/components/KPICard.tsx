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
  const trendColor = trend === "up" ? "text-green-500" : "text-red-500";
  const trendBg = trend === "up" ? "bg-green-500/10" : "bg-red-500/10";

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-tournament transition-smooth group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 ml-2">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="space-y-2 sm:space-y-3">
          <div className="text-lg sm:text-2xl font-bold text-card-foreground">{value}</div>
          
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trendBg}`}>
              <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {change}
              </span>
            </div>
            
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-smooth" />
          </div>
          
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}