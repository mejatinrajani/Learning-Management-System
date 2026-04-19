#!/usr/bin/env python
"""
Setup script to create test data for attendance demo
Run with: python manage.py shell < setup_attendance_demo.py
"""

from core.models import *
from attendance.models import AttendanceStatus

print("Step 1: Creating Attendance Statuses...")
statuses = [
    {'name': 'Present', 'short_code': 'P', 'is_present': True, 'color_code': '#10B981'},
    {'name': 'Absent', 'short_code': 'A', 'is_present': False, 'color_code': '#EF4444'},
    {'name': 'Late', 'short_code': 'L', 'is_present': False, 'color_code': '#F59E0B'},
    {'name': 'Excused', 'short_code': 'E', 'is_present': False, 'color_code': '#3B82F6'},
]

for status in statuses:
    AttendanceStatus.objects.get_or_create(**status)
print("✓ Attendance statuses created")

print("\nStep 2: Getting/Creating School...")
school, _ = School.objects.get_or_create(
    name='Demo School',
    defaults={'address': '123 Education St', 'email': 'school@example.com'}
)
print(f"✓ School: {school.name}")

print("\nStep 3: Creating Classes...")
class_10, _ = Class.objects.get_or_create(name='Class 10', school=school)
class_11, _ = Class.objects.get_or_create(name='Class 11', school=school)
print(f"✓ Classes: {class_10.name}, {class_11.name}")

print("\nStep 4: Getting Teacher User...")
teacher_user = User.objects.get(username='test2')
print(f"✓ Teacher: {teacher_user.first_name} {teacher_user.last_name}")

print("\nStep 5: Creating/Getting Teacher Profile...")
teacher_profile, created = TeacherProfile.objects.get_or_create(
    user=teacher_user,
    defaults={
        'employee_id': f'EMP{teacher_user.id}',
        'school': school,
        'experience_years': 5
    }
)
if created:
    print("✓ Teacher Profile created")
else:
    print("✓ Teacher Profile already exists")

print("\nStep 6: Creating Sections...")
sec_a, _ = Section.objects.get_or_create(name='A', class_assigned=class_10, defaults={'class_teacher': teacher_user})
sec_b, _ = Section.objects.get_or_create(name='B', class_assigned=class_10, defaults={'class_teacher': teacher_user})
sec_c, _ = Section.objects.get_or_create(name='C', class_assigned=class_11, defaults={'class_teacher': teacher_user})
print(f"✓ Sections: {sec_a}, {sec_b}, {sec_c}")

print("\nStep 7: Creating Students...")
students_data = [
    ('student1', 'Raj', 'Kumar', 'STU001'),
    ('student2', 'Priya', 'Singh', 'STU002'),
    ('student3', 'Arjun', 'Patel', 'STU003'),
    ('student4', 'Isha', 'Sharma', 'STU004'),
    ('student5', 'Vikram', 'Gupta', 'STU005'),
]

for username, first_name, last_name, student_id in students_data:
    user, _ = User.objects.get_or_create(
        username=username,
        defaults={
            'first_name': first_name,
            'last_name': last_name,
            'email': f'{username}@example.com',
            'role': 'STUDENT',
        }
    )
    
    # Distribute students: first 2 in sec_a, next 2 in sec_b, last in sec_c
    if username in ['student1', 'student2']:
        section = sec_a
        class_assigned = class_10
    elif username in ['student3', 'student4']:
        section = sec_b
        class_assigned = class_10
    else:
        section = sec_c
        class_assigned = class_11
    
    profile, created = StudentProfile.objects.get_or_create(
        user=user,
        defaults={
            'student_id': student_id,
            'school': school,
            'class_assigned': class_assigned,
            'section': section,
            'roll_number': student_id[-1],
        }
    )
    if created:
        print(f"  ✓ {first_name} {last_name} ({student_id}) added to {section}")

print("\nStep 8: Assigning Teacher to Sections...")
teacher_profile.sections.set([sec_a, sec_b, sec_c])
print(f"✓ Teacher assigned to 3 sections")

print("\n" + "="*60)
print("✅ SETUP COMPLETE!")
print("="*60)
print("\nYou can now:")
print("1. Login as: username='test2', password='teacher123'")
print("2. Go to: http://localhost:8080/teacher/mark-attendance")
print("3. Select a class and date")
print("4. Mark attendance for 4-5 students as:")
print("   - Present ✓")
print("   - Absent ✗")
print("   - Late ⏱️")
print("   - Excused ⊗")
print("\n" + "="*60)
