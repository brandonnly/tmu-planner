from typing import Optional, Dict, Any
from decimal import Decimal
from bs4 import BeautifulSoup
import re

class Course:
    def __init__(
        self,
        code: str,
        name: str,
        description: str,
        url: str,
        academic_year: str,
        gpa_weight: Optional[Decimal] = None,
        course_count: Optional[Decimal] = None,
        billing_units: Optional[int] = None,
        custom_requisite: Optional[str] = None,
        prerequisite: Optional[str] = None,
        corequisite: Optional[str] = None,
        antirequisite: Optional[str] = None,
        weekly_contact: Optional[str] = None,
    ):
        self.code = code
        self.name = name
        self.description = description
        self.url = url
        self.academic_year = academic_year
        self.gpa_weight = gpa_weight
        self.course_count = course_count
        self.billing_units = billing_units
        self.custom_requisite = custom_requisite
        self.prerequisite = prerequisite
        self.corequisite = corequisite
        self.antirequisite = antirequisite
        self.weekly_contact = weekly_contact

    @classmethod
    def from_calendar_page(cls, html: str, url: str) -> "Course":
        """
        Create a Course instance from a TMU calendar page HTML.
        
        Args:
            html: The HTML content of the course page
            url: The URL of the course page
            
        Returns:
            A Course instance populated with data from the page
        """
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract academic year from URL (e.g., from /calendar/2024-2025/courses/...)
        academic_year = re.search(r'/calendar/(\d{4}-\d{4})/', url).group(1)
        
        # Extract course code and name from the h1 and h2
        code = soup.find('h1').text.strip()  # "ACC 100"
        name = soup.find('h2').text.strip()  # "Introductory Financial Accounting"
        
        # Get description from the courseDescription div
        description = soup.find('div', class_='courseDescription').text.strip()
        
        # Extract various fields using their labels and classes
        def find_field(label: str) -> Optional[str]:
            # Find the div containing our label
            div = soup.find('div', class_=label.lower().replace(' ', ''))
            if not div:
                return None
            # Find the span with class courseInfoValues
            values_span = div.find('span', class_='courseInfoValues')
            if not values_span:
                return None
            return values_span.get_text(strip=True)
        
        # Parse numeric fields
        weekly_contact = find_field("courseLength")
        gpa_weight = Decimal(find_field("courseWeight")) if find_field("courseWeight") else None
        course_count = Decimal(find_field("courseCount")) if find_field("courseCount") else None
        billing_units = int(find_field("courseUnits")) if find_field("courseUnits") else None
        
        # Get requisites - these are in the requisites divs
        def find_requisite(heading: str) -> Optional[str]:
            # Find the h3 containing our heading
            h3 = soup.find('h3', string=heading)
            if not h3:
                return None
            # Get the next p tag
            p = h3.find_next('p')
            if not p:
                return None
            # Return the text
            return ''.join(str(content) if isinstance(content, str) else content.get_text() 
                          for content in p.contents).strip()
        
        prerequisite = find_requisite("Prerequisites")
        corequisite = find_requisite("Co-Requisites")
        antirequisite = find_requisite("Antirequisites")
        custom_requisite = find_requisite("Custom Requisites")
        
        # Create and return a new Course instance
        return cls(
            code=code,
            name=name,
            description=description,
            url=url,
            academic_year=academic_year,
            gpa_weight=gpa_weight,
            course_count=course_count,
            billing_units=billing_units,
            weekly_contact=weekly_contact,
            prerequisite=prerequisite,
            corequisite=corequisite,
            antirequisite=antirequisite,
            custom_requisite=custom_requisite,
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert the course to a dictionary for database insertion"""
        return {
            "code": self.code,
            "name": self.name,
            "description": self.description,
            "url": self.url,
            "academic_year": self.academic_year,
            "gpa_weight": self.gpa_weight,
            "course_count": self.course_count,
            "billing_units": self.billing_units,
            "custom_requisite": self.custom_requisite,
            "prerequisite": self.prerequisite,
            "corequisite": self.corequisite,
            "antirequisite": self.antirequisite,
            "weekly_contact": self.weekly_contact,
        }

    def __str__(self) -> str:
        return f"{self.code}: {self.name} ({self.academic_year})"

    def __repr__(self) -> str:
        return f"Course(code='{self.code}', name='{self.name}', academic_year='{self.academic_year}')"