import typer
import httpx
from models import Course

app = typer.Typer(
    name="tmu-scraper",
    help="CLI tool for scraping TMU course data",
    add_completion=False,
)

@app.command()
def scrape_course(
    url: str = typer.Argument(..., help="URL of the TMU course page to scrape"),
    academic_year: str = typer.Option(
        "2023-2024",
        "--year",
        "-y",
        help="Academic year of the course (e.g., 2023-2024)",
    ),
) -> None:
    """
    Scrape a single course from the TMU Academic Calendar and display its data.
    """
    try:
        # Fetch the course page
        response = httpx.get(url)
        response.raise_for_status()
        
        # Parse the course data
        course = Course.from_calendar_page(
            html=response.text,
            url=url,
            academic_year=academic_year,
        )
        
        # Display the course data nicely using Rich (included with Typer)
        typer.echo("\nCourse Details:")
        typer.echo("─" * 50)
        
        for key, value in course.to_dict().items():
            if value is not None:
                typer.echo(f"{key.replace('_', ' ').title()}: {value}")
                
    except httpx.HTTPError as e:
        typer.secho(f"Error fetching course page: {e}", fg=typer.colors.RED)
        raise typer.Exit(1)
    except Exception as e:
        typer.secho(f"Error parsing course data: {e}", fg=typer.colors.RED)
        raise typer.Exit(1)

if __name__ == "__main__":
    app() 