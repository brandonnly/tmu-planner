import typer
import httpx
from bs4 import BeautifulSoup
from models import Course
from typing import List, Optional, Set
import asyncio
from rich.progress import Progress
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import random  # Add random for delays
import json
from pathlib import Path
from db.operations import upload_courses

app = typer.Typer(
    name="tmu-scraper",
    help="CLI tool for scraping TMU course data",
    add_completion=False,
)

def debug_print(msg: str, debug: bool = False) -> None:
    """Print debug messages if debug mode is enabled."""
    if debug:
        print(msg)

async def get_course_links_from_department(url: str, debug: bool = False) -> Set[str]:
    """Extract course links from a department page using Selenium."""
    links = set()
    base_url = "https://www.torontomu.ca"
    
    # Set up Chrome in headless mode
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    
    debug_print("\nDEBUG: Loading department page with Selenium...", debug)
    with webdriver.Chrome(options=options) as driver:
        driver.get(url)
        
        # Wait for course links to be present (up to 10 seconds)
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "courseCode"))
            )
            debug_print("Course links loaded successfully", debug)
        except Exception as e:
            debug_print(f"Error waiting for course links: {e}", debug)
            return links
        
        # Find all course links
        course_links = driver.find_elements(By.CLASS_NAME, "courseCode")
        debug_print(f"Found {len(course_links)} course links", debug)
        
        for link in course_links:
            href = link.get_attribute('href')
            if href and href.startswith(base_url):
                links.add(href)
            elif href and href.startswith('/'):
                links.add(base_url + href)
            debug_print(f"Added course link: {href}", debug)
    
    debug_print(f"Total course links found: {len(links)}", debug)
    return links

def get_department_links(url: str, debug: bool = False) -> Set[str]:
    """Extract department links from the courses page using Selenium."""
    links = set()
    base_url = "https://www.torontomu.ca"
    
    # Set up Chrome in headless mode
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    
    debug_print("\nDEBUG: Loading courses page with Selenium...", debug)
    with webdriver.Chrome(options=options) as driver:
        driver.get(url)
        
        # Wait for the table to be present
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "sorting_1"))
            )
            debug_print("Department table loaded successfully", debug)
        except Exception as e:
            debug_print(f"Error waiting for department table: {e}", debug)
            return links
        
        # Find all department links
        link_cells = driver.find_elements(By.CLASS_NAME, "sorting_1")
        debug_print(f"Found {len(link_cells)} department cells", debug)
        
        for cell in link_cells:
            try:
                link = cell.find_element(By.TAG_NAME, "a")
                href = link.get_attribute('href')
                if href:
                    # Remove .html and convert to public URL format
                    public_url = re.sub(r'(/content/ryerson)?(/calendar/[^/]+/courses/[^/.]+)(\.html)?', r'\2/', href)
                    if not public_url.startswith('http'):
                        public_url = base_url + public_url
                    links.add(public_url)
                    debug_print(f"Added department URL: {public_url}", debug)
            except Exception as e:
                debug_print(f"Error processing department link: {e}", debug)
                continue
    
    debug_print(f"Total department links found: {len(links)}", debug)
    return links

async def fetch_courses(urls: List[str], client: httpx.AsyncClient, progress: Progress, debug: bool = False) -> List[Course]:
    """Fetch multiple courses in parallel."""
    task = progress.add_task("[cyan]Scraping courses...", total=len(urls))
    error_counts = {}
    valid_courses = []
    retry_delay = 5  # Seconds to wait after a failed request
    max_retries = 3  # Maximum number of retries per request
    
    async def fetch_course(url: str) -> Optional[Course]:
        retries = 0
        while retries < max_retries:
            try:
                response = await client.get(url)
                
                # Handle rate limiting (429) specifically
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', retry_delay))
                    debug_print(f"Rate limited. Waiting {retry_after} seconds...", debug)
                    await asyncio.sleep(retry_after)
                    retries += 1
                    continue
                
                response.raise_for_status()
                
                course = Course.from_calendar_page(response.text, url)
                return course
                
            except httpx.HTTPError as e:
                # Retry for any connection error or server error
                if isinstance(e, (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout)) or \
                   (isinstance(e, httpx.HTTPStatusError) and e.response.status_code >= 500):
                    if debug:
                        debug_print(f"Connection error for {url}, retrying in {retry_delay}s: {type(e).__name__}", debug)
                    await asyncio.sleep(retry_delay)
                    retries += 1
                    continue
                error_counts[type(e).__name__] = error_counts.get(type(e).__name__, 0) + 1
                return None
                
            except Exception as e:
                error_counts[type(e).__name__] = error_counts.get(type(e).__name__, 0) + 1
                if debug:
                    debug_print(f"Error parsing course {url}: {type(e).__name__}: {str(e)}", debug)
                return None
                
            finally:
                progress.update(task, advance=1)
        
        if retries == max_retries:
            if debug:
                debug_print(f"Max retries reached for {url}", debug)
            error_counts["MaxRetriesExceeded"] = error_counts.get("MaxRetriesExceeded", 0) + 1
        return None
    
    # Fetch all courses in parallel
    tasks = [fetch_course(url) for url in urls]
    results = await asyncio.gather(*tasks)
    
    # Add valid courses
    valid_courses = [c for c in results if c is not None]
    
    # Add debug info
    if debug:
        debug_print(f"Results: {len(valid_courses)} successful, {len(urls) - len(valid_courses)} failed", debug)
        if error_counts:
            debug_print("Errors:", debug)
            for error_type, count in error_counts.items():
                debug_print(f"  {error_type}: {count}", debug)
    
    return valid_courses

@app.command()
def course(
    url: str = typer.Argument(..., help="URL of the TMU course page to scrape"),
    debug: bool = typer.Option(False, "--debug", "-d", help="Enable debug output"),
) -> None:
    """Scrape a single course from the TMU Academic Calendar."""
    try:
        debug_print(f"\nFetching single course from {url}", debug)
        response = httpx.get(url)
        response.raise_for_status()
        
        if debug:
            debug_print("Response content preview:", debug)
            debug_print(response.text[:200] + "...", debug)
        
        course = Course.from_calendar_page(response.text, url)
        
        typer.echo("\nCourse Details:")
        typer.echo("─" * 50)
        
        for key, value in course.to_dict().items():
            if value is not None:
                typer.echo(f"{key.replace('_', ' ').title()}: {value}")
                
    except Exception as e:
        typer.secho(f"Error: {type(e).__name__}: {str(e)}", fg=typer.colors.RED)
        if debug:
            import traceback
            debug_print(traceback.format_exc(), debug)
        raise typer.Exit(1)

@app.command()
def department(
    url: str = typer.Argument(..., help="URL of the TMU department page to scrape"),
    debug: bool = typer.Option(False, "--debug", "-d", help="Enable debug output"),
    print_courses: bool = typer.Option(False, "--print", "-p", help="Print all parsed courses using their string representation"),
) -> None:
    """Scrape all courses from a department."""
    try:
        # Get all course links using Selenium
        course_urls = get_course_links_from_department(url, debug)
        
        if not course_urls:
            typer.secho("No courses found in department", fg=typer.colors.RED)
            raise typer.Exit(1)
        
        debug_print(f"\nFound {len(course_urls)} course URLs:", debug)
        if debug:
            for url in course_urls:
                debug_print(f"  {url}", debug)
        
        # Fetch all courses
        async def fetch_all():
            async with httpx.AsyncClient() as client:
                with Progress() as progress:
                    return await fetch_courses(list(course_urls), client, progress, debug)
        
        courses = asyncio.run(fetch_all())
        
        if not courses:
            typer.secho("No courses were successfully parsed", fg=typer.colors.RED)
            raise typer.Exit(1)
        
        # Display results
        typer.echo(f"\nFound {len(courses)} courses:")
        typer.echo("─" * 50)
        
        if print_courses:
            # Print using the model's string representation
            for course in sorted(courses, key=lambda c: c.code):
                typer.echo(str(course))
        else:
            # Print code and name only
            for course in sorted(courses, key=lambda c: c.code):
                typer.echo(f"{course.code}: {course.name}")
                
    except Exception as e:
        typer.secho(f"Error: {e}", fg=typer.colors.RED)
        raise typer.Exit(1)

@app.command()
def upload(
    json_path: Path = typer.Argument(..., help="Path to the JSON file containing courses"),
    env: str = typer.Option("local", "--env", "-e", help="Supabase environment to use (local/production)"),
) -> None:
    """Upload courses from a JSON file to Supabase."""
    try:
        if not json_path.exists():
            typer.secho(f"Error: File {json_path} does not exist", fg=typer.colors.RED)
            raise typer.Exit(1)
            
        # Load courses from JSON
        typer.echo(f"Loading courses from {json_path}")
        with open(json_path, 'r', encoding='utf-8') as f:
            courses_data = json.load(f)
            
        # Convert JSON data to Course objects
        courses = []
        for course_data in courses_data:
            try:
                course = Course(
                    code=course_data['code'],
                    name=course_data['name'],
                    description=course_data['description'],
                    url=course_data['url'],
                    academic_year=course_data['academic_year'],
                    gpa_weight=course_data.get('gpa_weight'),
                    course_count=course_data.get('course_count'),
                    billing_units=course_data.get('billing_units'),
                    custom_requisite=course_data.get('custom_requisite'),
                    prerequisite=course_data.get('prerequisite'),
                    corequisite=course_data.get('corequisite'),
                    antirequisite=course_data.get('antirequisite'),
                    weekly_contact=course_data.get('weekly_contact'),
                )
                courses.append(course)
            except Exception as e:
                typer.secho(f"Error loading course: {str(e)}", fg=typer.colors.RED)
                continue
                
        # Upload to Supabase
        typer.echo(f"Uploading {len(courses)} courses to {env} database...")
        processed, uploaded = upload_courses(courses, env=env)
        typer.echo(f"Upload complete: {uploaded}/{processed} courses uploaded successfully")
        
    except Exception as e:
        typer.secho(f"Error: {str(e)}", fg=typer.colors.RED)
        raise typer.Exit(1)

@app.command()
def calendar(
    url: str = typer.Argument(..., help="URL of the TMU academic calendar courses page"),
    debug: bool = typer.Option(False, "--debug", "-d", help="Enable debug output"),
    print_courses: bool = typer.Option(False, "--print", "-p", help="Print all parsed courses using their string representation"),
    max_concurrent: int = typer.Option(5, "--max-concurrent", "-m", help="Maximum number of concurrent department scrapes"),
    limit: Optional[int] = typer.Option(None, "--limit", "-l", help="Limit the number of departments to scrape"),
    output: Optional[Path] = typer.Option(None, "--output", "-o", help="Output directory for JSON files (defaults to output/courses)"),
    upload_env: Optional[str] = typer.Option(None, "--upload", "-u", help="Upload to Supabase environment (local/production)"),
) -> None:
    """Scrape all courses from the entire academic calendar."""
    try:
        # Extract academic year from URL
        year_match = re.search(r'/calendar/(\d{4})-(\d{4})/', url)
        if not year_match:
            typer.secho("Could not extract academic year from URL", fg=typer.colors.RED)
            raise typer.Exit(1)
            
        start_year, end_year = year_match.groups()
        academic_year = f"{start_year}_{end_year}"
        
        # Set up output path
        if output is None:
            output = Path("output/courses")
        output.mkdir(parents=True, exist_ok=True)
        
        # Create the full output path with academic year
        output_file = output / f"{academic_year}.json"
        
        # Get all department links using Selenium
        department_urls = get_department_links(url, debug)
        
        if not department_urls:
            typer.secho("No departments found", fg=typer.colors.RED)
            raise typer.Exit(1)
        
        # Apply limit if specified
        if limit is not None:
            department_urls = set(list(department_urls)[:limit])
            typer.echo(f"\nLimiting to {limit} departments")
        
        typer.echo(f"\nFound {len(department_urls)} departments")
        
        # Process departments and their courses
        all_courses = []
        
        async def process_departments():
            # Create HTTP client with timeouts and limits for course fetching
            timeout = httpx.Timeout(30.0, connect=10.0)
            limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
            
            async with httpx.AsyncClient(timeout=timeout, limits=limits) as client:
                with Progress() as progress:
                    dept_task = progress.add_task(
                        f"[cyan]Processing {len(department_urls)} departments...",
                        total=len(department_urls)
                    )
                    course_task = progress.add_task("[yellow]Total courses found...", total=None)
                    
                    # Process departments in chunks
                    dept_list = list(department_urls)
                    for i in range(0, len(dept_list), max_concurrent):
                        chunk = dept_list[i:i + max_concurrent]
                        chunk_num = i//max_concurrent + 1
                        total_chunks = (len(dept_list) + max_concurrent - 1)//max_concurrent
                        
                        if debug:
                            debug_print(f"Processing department chunk {chunk_num}/{total_chunks}", debug)
                        
                        # Get course URLs for each department in parallel
                        dept_tasks = [get_course_links_from_department(dept_url, debug) for dept_url in chunk]
                        dept_results = await asyncio.gather(*dept_tasks)
                        
                        # Process courses from each department
                        for dept_idx, dept_courses in enumerate(dept_results):
                            dept_url = chunk[dept_idx]
                            if not dept_courses:
                                if debug:
                                    debug_print(f"No courses found in department: {dept_url}", debug)
                                continue
                            
                            if debug:
                                debug_print(f"Found {len(dept_courses)} courses in {dept_url}", debug)
                            
                            # Fetch all courses for this department
                            courses = await fetch_courses(list(dept_courses), client, progress, debug)
                            all_courses.extend(courses)
                            
                            # Update progress
                            progress.update(dept_task, advance=1)
                            progress.update(course_task, total=len(all_courses), completed=len(all_courses))
                            
                            # Random delay between departments (1-5 seconds)
                            if dept_idx < len(dept_results) - 1:  # No need to delay after last department in chunk
                                delay = random.uniform(1, 5)
                                if debug:
                                    debug_print(f"Waiting {delay:.1f}s before next department", debug)
                                await asyncio.sleep(delay)
                        
                        # Update progress description
                        progress.update(
                            dept_task,
                            description=f"[cyan]Processing departments {min(i + max_concurrent, len(dept_list))}/{len(dept_list)}..."
                        )
                        
                        # Random delay between chunks (1-5 seconds)
                        if i + max_concurrent < len(dept_list):
                            delay = random.uniform(1, 5)
                            if debug:
                                debug_print(f"Waiting {delay:.1f}s before next chunk", debug)
                            await asyncio.sleep(delay)
        
        # Run department processing
        asyncio.run(process_departments())
        
        if not all_courses:
            typer.secho("No courses were successfully parsed", fg=typer.colors.RED)
            raise typer.Exit(1)
        
        # Upload to Supabase if requested
        if upload_env:
            typer.echo(f"\nUploading {len(all_courses)} courses to {upload_env} database...")
            processed, uploaded = upload_courses(all_courses, env=upload_env)
            typer.echo(f"Upload complete: {uploaded}/{processed} courses uploaded successfully")
        
        # Save to JSON if output path specified
        if output:
            # Save courses to JSON with academic year in filename
            courses_data = [course.to_dict() for course in all_courses]
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(courses_data, f, indent=2, ensure_ascii=False)
            typer.echo(f"\nSaved {len(all_courses)} courses to {output_file}")

        # Display results
        typer.echo(f"\nSuccessfully parsed {len(all_courses)} courses:")
        typer.echo("─" * 50)
        
        if print_courses:
            # Print using the model's string representation
            for course in sorted(all_courses, key=lambda c: c.code):
                typer.echo(str(course))
        else:
            # Group courses by department code
            by_dept = {}
            for course in all_courses:
                dept_code = course.code.split()[0]
                by_dept.setdefault(dept_code, []).append(course)
            
            # Display courses grouped by department
            for dept_code in sorted(by_dept.keys()):
                typer.echo(f"\n{dept_code}:")
                for course in sorted(by_dept[dept_code], key=lambda c: c.code):
                    typer.echo(f"  {course.code}: {course.name}")
                
    except Exception as e:
        typer.secho(f"Error: {e}", fg=typer.colors.RED)
        raise typer.Exit(1)

if __name__ == "__main__":
    app() 