from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from applications.models import Application, ApplicationStatusHistory, Reminder
from communications.models import Communication
from resumes.models import Resume

User = get_user_model()

DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demopass123"
DEMO_EMAIL = "demo@example.com"

MASTER_RESUME_CONTENT = """\
Jordan Rivera
Software Developer

Summary
Full-stack developer with experience building web applications in Python and JavaScript.

Experience
- Software Developer Co-op, Northwind Systems (Jan 2025 - Aug 2025)
  Built and maintained internal REST APIs; improved test coverage from 40% to 85%.
- Teaching Assistant, CMPUT 275, University of Alberta (Sep 2024 - Dec 2024)
  Ran weekly labs for 60 students on data structures and embedded systems.

Education
- BSc Computer Science, University of Alberta (Expected 2026)

Skills
Python, Django, JavaScript, React, SQL, Git, Docker
"""


def days_ago(n):
    return timezone.now() - timedelta(days=n)


def in_days(n):
    return timezone.now() + timedelta(days=n)


class Command(BaseCommand):
    help = "Seed the database with simulated demo data (a demo user, applications, resumes, reminders, communications)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete the demo user's existing data before reseeding.",
        )

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            username=DEMO_USERNAME,
            defaults={"email": DEMO_EMAIL},
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created demo user '{DEMO_USERNAME}'"))

        if options["reset"]:
            Application.objects.filter(owner=user).delete()
            Resume.objects.filter(owner=user).delete()
            self.stdout.write("Cleared existing demo data for reseeding.")

        if Application.objects.filter(owner=user).exists():
            self.stdout.write(
                "Demo data already present for 'demo' user, skipping (pass --reset to reseed)."
            )
            return

        master_resume = Resume.objects.create(
            owner=user,
            title="Master Resume",
            is_master=True,
            content=MASTER_RESUME_CONTENT,
        )

        applications_data = [
            {
                "key": "shopify",
                "company_name": "Shopify",
                "position_title": "Backend Developer Intern",
                "job_posting_url": "https://www.shopify.com/careers",
                "location": "Remote",
                "salary_range": "$70,000 - $80,000",
                "stage": Application.Stage.OFFER,
                "date_applied": days_ago(30).date(),
                "notes": "Referred by a former TA. Really liked the team during the interview.",
                "created_at": days_ago(35),
                "history": [
                    (Application.Stage.APPLIED, days_ago(30), "Submitted application and cover letter."),
                    (Application.Stage.INTERVIEW, days_ago(20), "Phone screen scheduled with recruiter."),
                    (Application.Stage.OFFER, days_ago(5), "Received verbal offer, waiting on paperwork."),
                ],
                "communications": [
                    (Communication.Type.EMAIL, Communication.Direction.OUTBOUND, "Recruiting Team", "Application submitted", days_ago(30)),
                    (Communication.Type.EMAIL, Communication.Direction.INBOUND, "Priya Nair", "Interview invitation", days_ago(21)),
                    (Communication.Type.INTERVIEW, Communication.Direction.INBOUND, "Priya Nair", "Technical interview", days_ago(18)),
                    (Communication.Type.OFFER, Communication.Direction.INBOUND, "Priya Nair", "Offer letter", days_ago(5)),
                ],
                "reminders": [
                    ("Respond to offer letter", in_days(3), "Decide and reply before the deadline.", False),
                ],
                "tailored_resume": "Resume tailored for Shopify (backend/API focus).",
            },
            {
                "key": "rbc",
                "company_name": "RBC",
                "position_title": "Software Engineer",
                "job_posting_url": "https://jobs.rbc.com",
                "location": "Toronto, ON (Hybrid)",
                "salary_range": "$65,000 - $75,000",
                "stage": Application.Stage.INTERVIEW,
                "date_applied": days_ago(25).date(),
                "notes": "Second interview will focus on system design.",
                "created_at": days_ago(27),
                "history": [
                    (Application.Stage.APPLIED, days_ago(25), "Applied through careers portal."),
                    (Application.Stage.INTERVIEW, days_ago(10), "Passed phone screen, technical interview booked."),
                ],
                "communications": [
                    (Communication.Type.EMAIL, Communication.Direction.INBOUND, "RBC Talent Acquisition", "Application received", days_ago(24)),
                    (Communication.Type.PHONE_CALL, Communication.Direction.INBOUND, "Marc Dubois", "Interview scheduling call", days_ago(12)),
                ],
                "reminders": [
                    ("Prepare for technical interview", in_days(2), "Review system design basics and past projects.", False),
                ],
                "tailored_resume": None,
            },
            {
                "key": "nimbus",
                "company_name": "Startup Nimbus",
                "position_title": "Full Stack Developer",
                "job_posting_url": "",
                "location": "Edmonton, AB",
                "salary_range": "",
                "stage": Application.Stage.REJECTED,
                "date_applied": days_ago(40).date(),
                "notes": "Good learning experience for interview prep.",
                "created_at": days_ago(42),
                "history": [
                    (Application.Stage.APPLIED, days_ago(40), "Applied via job board."),
                    (Application.Stage.REJECTED, days_ago(20), "Went with a candidate with more React experience."),
                ],
                "communications": [
                    (Communication.Type.REJECTION, Communication.Direction.INBOUND, "Hiring Manager", "Application update", days_ago(20)),
                ],
                "reminders": [],
                "tailored_resume": None,
            },
            {
                "key": "telus",
                "company_name": "TELUS",
                "position_title": "Data Analyst Co-op",
                "job_posting_url": "https://www.telus.com/en/careers",
                "location": "Calgary, AB",
                "salary_range": "$25/hr",
                "stage": Application.Stage.APPLIED,
                "date_applied": days_ago(5).date(),
                "notes": "",
                "created_at": days_ago(5),
                "history": [
                    (Application.Stage.APPLIED, days_ago(5), "Submitted application and transcript."),
                ],
                "communications": [
                    (Communication.Type.EMAIL, Communication.Direction.INBOUND, "TELUS Careers", "Application acknowledgement", days_ago(5)),
                ],
                "reminders": [
                    ("Follow up if no response", in_days(9), "Two weeks with no response is a good time to check in.", False),
                ],
                "tailored_resume": None,
            },
            {
                "key": "google",
                "company_name": "Google",
                "position_title": "Software Engineering Intern",
                "job_posting_url": "https://careers.google.com",
                "location": "Waterloo, ON",
                "salary_range": "",
                "stage": Application.Stage.WISHLIST,
                "date_applied": None,
                "notes": "Alex from CMPUT 401 offered to submit a referral.",
                "created_at": days_ago(3),
                "history": [],
                "communications": [],
                "reminders": [
                    ("Ask Alex for referral", in_days(1), "Send resume and posting link before Friday.", False),
                ],
                "tailored_resume": None,
            },
            {
                "key": "collective",
                "company_name": "Local Nonprofit Tech Collective",
                "position_title": "Junior Developer",
                "job_posting_url": "",
                "location": "Edmonton, AB (Remote)",
                "salary_range": "$22/hr",
                "stage": Application.Stage.WITHDRAWN,
                "date_applied": days_ago(60).date(),
                "notes": "Withdrew after accepting the Shopify offer track.",
                "created_at": days_ago(62),
                "history": [
                    (Application.Stage.APPLIED, days_ago(60), "Applied to posting shared in a course Slack."),
                    (Application.Stage.WITHDRAWN, days_ago(45), "Withdrew application, pursuing other offers."),
                ],
                "communications": [],
                "reminders": [],
                "tailored_resume": None,
            },
            {
                "key": "atlassian",
                "company_name": "Atlassian",
                "position_title": "Frontend Developer",
                "job_posting_url": "https://www.atlassian.com/company/careers",
                "location": "Remote",
                "salary_range": "$68,000 - $78,000",
                "stage": Application.Stage.APPLIED,
                "date_applied": days_ago(12).date(),
                "notes": "Tailored resume to emphasize React/design system work.",
                "created_at": days_ago(12),
                "history": [
                    (Application.Stage.APPLIED, days_ago(12), "Applied with tailored resume."),
                ],
                "communications": [
                    (Communication.Type.EMAIL, Communication.Direction.INBOUND, "Atlassian Careers", "Application received", days_ago(11)),
                ],
                "reminders": [],
                "tailored_resume": "Resume tailored for Atlassian (frontend/React focus).",
            },
        ]

        for data in applications_data:
            application = Application.objects.create(
                owner=user,
                company_name=data["company_name"],
                position_title=data["position_title"],
                job_posting_url=data["job_posting_url"],
                location=data["location"],
                salary_range=data["salary_range"],
                stage=data["stage"],
                date_applied=data["date_applied"],
                notes=data["notes"],
            )
            Application.objects.filter(pk=application.pk).update(
                created_at=data["created_at"], updated_at=data["created_at"]
            )

            for stage, changed_at, note in data["history"]:
                history = ApplicationStatusHistory.objects.create(
                    application=application, stage=stage, note=note
                )
                ApplicationStatusHistory.objects.filter(pk=history.pk).update(changed_at=changed_at)

            for comm_type, direction, contact_name, subject, occurred_at in data["communications"]:
                Communication.objects.create(
                    application=application,
                    type=comm_type,
                    direction=direction,
                    contact_name=contact_name,
                    subject=subject,
                    occurred_at=occurred_at,
                )

            for title, due_at, notes, is_completed in data["reminders"]:
                Reminder.objects.create(
                    application=application,
                    title=title,
                    due_at=due_at,
                    notes=notes,
                    is_completed=is_completed,
                )

            if data["tailored_resume"]:
                Resume.objects.create(
                    owner=user,
                    title=f"Resume - {data['company_name']}",
                    is_master=False,
                    based_on=master_resume,
                    application=application,
                    content=master_resume.content + f"\n\n---\n{data['tailored_resume']}\n",
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(applications_data)} applications for user '{DEMO_USERNAME}' "
                f"(password: '{DEMO_PASSWORD}')."
            )
        )
