from typing import List, Optional
from models import Course
from db.client import get_supabase_client


def upload_courses(courses: List[Course], env: Optional[str] = None) -> tuple[int, int]:
    """
    Upload a list of courses to Supabase, using upsert to handle duplicates.
    
    Args:
        courses: List of Course objects to upload
        env: Optional environment override ('local' or 'production')
    
    Returns:
        Tuple of (number of courses processed, number of courses successfully uploaded)
    
    Raises:
        Exception: If there's an error during upload
    """
    supabase = get_supabase_client(env)
    
    # Convert courses to dictionaries for upload
    course_dicts = [course.to_dict() for course in courses]
    
    # Use upsert with url as the conflict detection column
    # This ensures we update existing courses rather than creating duplicates
    result = supabase.table('course') \
        .upsert(course_dicts, on_conflict='url') \
        .execute()
        
    # Return processed and uploaded counts
    return len(courses), len(result.data) if result.data else 0

def upload_course(course: Course, env: Optional[str] = None) -> bool:
    """
    Upload a single course to Supabase.
    
    Args:
        course: Course object to upload
        env: Optional environment override ('local' or 'production')
    
    Returns:
        True if upload was successful, False otherwise
    
    Raises:
        Exception: If there's an error during upload
    """
    processed, uploaded = upload_courses([course], env)
    return uploaded == 1 