
from django.db import models
from django.core.validators import FileExtensionValidator
from core.models import User, StudentProfile, TeacherProfile, Subject, Section, Class

class Assignment(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('assigned', 'Assigned'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE)
    assigned_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    max_marks = models.IntegerField()
    instructions = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to='assignments/attachments/',
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'])]
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    allow_late_submission = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.subject.name} - {self.class_assigned.name}-{self.section.name}"

    @property
    def is_overdue(self):
        from django.utils import timezone
        return timezone.now() > self.due_date

class AssignmentSubmission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
        ('returned', 'Returned'),
        ('resubmitted', 'Resubmitted'),
    ]

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    submission_text = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to='assignments/submissions/',
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'])]
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(TeacherProfile, on_delete=models.SET_NULL, null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['assignment', 'student']

    @property
    def is_late(self):
        return self.submitted_at > self.assignment.due_date

    @property
    def grade_percentage(self):
        if self.marks_obtained and self.assignment.max_marks:
            return (self.marks_obtained / self.assignment.max_marks) * 100
        return None

    def __str__(self):
        return f"{self.student.full_name} - {self.assignment.title}"

from django.db import models
from django.core.validators import FileExtensionValidator

class AssignmentResource(models.Model):
    assignment = models.ForeignKey('Assignment', on_delete=models.CASCADE, related_name='resources')
    file = models.FileField(
        upload_to='assignments/resources/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'])]
    )
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename