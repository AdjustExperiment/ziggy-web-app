import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "relative overflow-hidden min-h-[44px] min-w-[44px] transition-all duration-300 hover:scale-110",
        "text-white hover:text-primary hover:bg-white/10 backdrop-blur-sm",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/20 before:to-transparent",
        "before:backdrop-blur-sm before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
      )}
    >
      <div className="relative z-10 flex items-center justify-center">
        {resolvedTheme === "dark" ? (
          <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
        ) : (
          <Moon className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>
      
      {/* Blurred text overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span 
          className={cn(
            "text-xs font-medium transition-all duration-300 opacity-0 hover:opacity-60",
            "text-primary blur-[2px] select-none",
            resolvedTheme === "dark" ? "animate-pulse" : ""
          )}
        >
          {resolvedTheme === "dark" ? "LIGHT" : "DARK"}
        </span>
      </div>
    </Button>
  )
}