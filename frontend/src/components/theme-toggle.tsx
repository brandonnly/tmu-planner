import { Moon, Sun, SunMoon } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"

type Theme = "light" | "dark" | "system"

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme") as Theme
    return savedTheme || "system"
  })

  useEffect(() => {
    const root = window.document.documentElement

    if (theme === "system") {
      const systemTheme = getSystemTheme()
      root.classList.remove("light", "dark")
      root.classList.add(systemTheme)
    } else {
      root.classList.remove("light", "dark")
      root.classList.add(theme)
    }

    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      if (theme === "system") {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(getSystemTheme())
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const icons = {
    light: <Sun className="size-8" />,
    dark: <Moon className="size-8" />,
    system: <SunMoon className="size-8" />
  }

  const nextTheme: Record<Theme, Theme> = {
    light: "dark",
    dark: "system",
    system: "light"
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-12 w-12"
      onClick={() => setTheme(nextTheme[theme])}
      title={`Switch to ${nextTheme[theme]} theme`}
    >
      {icons[theme]}
    </Button>
  )
} 