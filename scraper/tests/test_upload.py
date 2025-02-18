import sys
from pathlib import Path
import json
from typing import List
from ..models import Course
from ..db.operations import upload_courses
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_courses_from_json(json_path: str) -> List[Course]:
    """
    Load course data from a JSON file produced by the calendar CLI.
    
    Args:
        json_path: Path to the JSON file containing course data
        
    Returns:
        List of Course objects
    """
    with open(json_path, 'r') as f:
        courses_data = json.load(f)
    
    courses = []
    for course_data in courses_data:
        try:
            # Create Course object from the JSON data
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
            logger.error(f"Error loading course: {str(e)}")
            continue
    
    return courses

def main():
    """Test uploading courses to local Supabase database."""
    if len(sys.argv) != 2:
        print("Usage: python -m scraper.tests.test_upload <path_to_courses.json>")
        sys.exit(1)
    
    json_path = sys.argv[1]
    if not Path(json_path).exists():
        print(f"Error: File {json_path} does not exist")
        sys.exit(1)
    
    try:
        # Load courses from JSON
        logger.info(f"Loading courses from {json_path}")
        courses = load_courses_from_json(json_path)
        logger.info(f"Loaded {len(courses)} courses")
        
        # Upload to local database
        logger.info("Uploading to local Supabase database...")
        processed, uploaded = upload_courses(courses, env='local')
        
        logger.info(f"Upload complete: {uploaded}/{processed} courses uploaded successfully")
        
    except Exception as e:
        logger.error(f"Error during upload test: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 