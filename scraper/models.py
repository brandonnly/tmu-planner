from typing import Optional, Dict, Any
from decimal import Decimal
from bs4 import BeautifulSoup

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
    def from_calendar_page(cls, html: str, url: str, academic_year: str) -> "Course":
        """
        Create a Course instance from a TMU calendar page HTML.
        
        Args:
            html: The HTML content of the course page
            url: The URL of the course page
            academic_year: The academic year (e.g., "2023-2024")
            
        Returns:
            A Course instance populated with data from the page
        """
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract course code and name from the h1 and h2
        code = soup.find('h1').text.strip()  # "ACC 100"
        name = soup.find('h2').text.strip()  # "Introductory Financial Accounting"
        
        # Get description (first p tag after h2)
        description = soup.find('h2').find_next('p').text.strip()
        
        # Extract various fields using their labels
        def find_field(label: str) -> Optional[str]:
            elem = soup.find(string=lambda x: x and label in x)
            if not elem:
                return None
            # Get the next text element after the label
            next_text = elem.find_next(text=True)
            return next_text.strip() if next_text else None
        
        # Parse numeric fields
        weekly_contact = find_field("Weekly Contact")
        gpa_weight = Decimal(find_field("GPA Weight")) if find_field("GPA Weight") else None
        course_count = Decimal(find_field("Course Count")) if find_field("Course Count") else None
        billing_units = int(find_field("Billing Units")) if find_field("Billing Units") else None
        
        # Get requisites
        prerequisite = find_field("Prerequisites")
        corequisite = find_field("Co-Requisites")
        antirequisite = find_field("Antirequisites")
        custom_requisite = find_field("Custom Requisites")
        
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