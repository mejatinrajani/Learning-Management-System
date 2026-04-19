
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import User, School, Class, Section, Subject, TeacherProfile, StudentProfile, ParentProfile, AuditLog
from .serializers import (
    UserSerializer, SchoolSerializer, ClassSerializer, SectionSerializer, 
    SubjectSerializer, TeacherProfileSerializer, StudentProfileSerializer, 
    ParentProfileSerializer, AuditLogSerializer, DashboardStatsSerializer
)
from .permissions import IsDeveloper, IsPrincipal, IsTeacher, CanManageUsers, CanViewStudentData

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsDeveloper]

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsPrincipal | IsTeacher]
    
    @action(detail=True, methods=['get'])
    def sections(self, request, pk=None):
        """Get all sections for a class"""
        class_obj = self.get_object()
        sections = class_obj.sections.all()
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data)

class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsPrincipal | IsTeacher]
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students in a section"""
        section = self.get_object()
        students = StudentProfile.objects.filter(section=section)
        serializer = StudentProfileSerializer(students, many=True)
        return Response(serializer.data)

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsPrincipal | IsTeacher]

class TeacherProfileViewSet(viewsets.ModelViewSet):
    queryset = TeacherProfile.objects.all()
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsPrincipal]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'TEACHER':
            # Teachers can only see their own profile
            return queryset.filter(user=self.request.user)
        return queryset
    
    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """Get teacher's schedule/timetable"""
        teacher = self.get_object()
        # This will be implemented when we add timetable views
        return Response({'message': 'Schedule endpoint - to be implemented'})

class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [CanViewStudentData]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'STUDENT':
            # Students can only see their own profile
            return queryset.filter(user=user)
        elif user.role == 'PARENT':
            # Parents can see their children's profiles
            try:
                parent_profile = ParentProfile.objects.get(user=user)
                return queryset.filter(id__in=parent_profile.children.values_list('id', flat=True))
            except ParentProfile.DoesNotExist:
                return queryset.none()
        elif user.role == 'TEACHER':
            # Teachers can see students in their sections
            try:
                teacher_profile = TeacherProfile.objects.get(user=user)
                return queryset.filter(section__in=teacher_profile.sections.all())
            except TeacherProfile.DoesNotExist:
                return queryset.none()
        
        # Principal and Developer can see all
        return queryset
    
    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        
        # Filter by class_assigned if provided
        class_assigned = self.request.query_params.get('class_assigned')
        if class_assigned:
            queryset = queryset.filter(class_assigned__id=class_assigned)
        
        # Filter by section if provided
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section__id=section)
        
        return queryset

class ParentProfileViewSet(viewsets.ModelViewSet):
    queryset = ParentProfile.objects.all()
    serializer_class = ParentProfileSerializer
    permission_classes = [IsPrincipal]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'PARENT':
            # Parents can only see their own profile
            return queryset.filter(user=self.request.user)
        return queryset

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsDeveloper]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        return queryset

class DashboardViewSet(viewsets.ViewSet):
    """Dashboard statistics for different user roles"""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics based on user role"""
        user = request.user
        stats = {}
        
        if user.role == 'DEVELOPER':
            stats = self._get_developer_stats()
        elif user.role == 'PRINCIPAL':
            stats = self._get_principal_stats(user)
        elif user.role == 'TEACHER':
            stats = self._get_teacher_stats(user)
        elif user.role == 'STUDENT':
            stats = self._get_student_stats(user)
        elif user.role == 'PARENT':
            stats = self._get_parent_stats(user)
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)
    
    def _get_developer_stats(self):
        return {
            'total_students': StudentProfile.objects.count(),
            'total_teachers': TeacherProfile.objects.count(),
            'total_classes': Class.objects.count(),
            'total_notices': 0,  # Will be updated when notices are implemented
            'pending_assignments': 0,  # Will be updated when assignments are implemented
            'attendance_percentage': 85.5  # Placeholder
        }
    
    def _get_principal_stats(self, user):
        # Similar to developer but school-specific
        try:
            school = School.objects.get(principal=user)
            return {
                'total_students': StudentProfile.objects.filter(school=school).count(),
                'total_teachers': TeacherProfile.objects.filter(school=school).count(),
                'total_classes': Class.objects.filter(school=school).count(),
                'total_notices': 0,
                'pending_assignments': 0,
                'attendance_percentage': 87.2
            }
        except School.DoesNotExist:
            return self._get_empty_stats()
    
    def _get_teacher_stats(self, user):
        try:
            teacher = TeacherProfile.objects.get(user=user)
            return {
                'total_students': StudentProfile.objects.filter(section__in=teacher.sections.all()).count(),
                'total_teachers': TeacherProfile.objects.filter(school=teacher.school).count(),
                'total_classes': teacher.sections.count(),
                'total_notices': 0,
                'pending_assignments': 0,
                'attendance_percentage': 92.3
            }
        except TeacherProfile.DoesNotExist:
            return self._get_empty_stats()
    
    def _get_student_stats(self, user):
        try:
            student = StudentProfile.objects.get(user=user)
            return {
                'total_students': StudentProfile.objects.filter(section=student.section).count(),
                'total_teachers': TeacherProfile.objects.filter(sections=student.section).count(),
                'total_classes': 1,
                'total_notices': 0,
                'pending_assignments': 0,
                'attendance_percentage': 89.7
            }
        except StudentProfile.DoesNotExist:
            return self._get_empty_stats()
    
    def _get_parent_stats(self, user):
        try:
            parent = ParentProfile.objects.get(user=user)
            children_count = parent.children.count()
            return {
                'total_students': children_count,
                'total_teachers': 0,
                'total_classes': children_count,
                'total_notices': 0,
                'pending_assignments': 0,
                'attendance_percentage': 88.5
            }
        except ParentProfile.DoesNotExist:
            return self._get_empty_stats()
    
    def _get_empty_stats(self):
        return {
            'total_students': 0,
            'total_teachers': 0,
            'total_classes': 0,
            'total_notices': 0,
            'pending_assignments': 0,
            'attendance_percentage': 0.0
        }

    @action(detail=False, methods=['get'])
    def recent_activities(self, request):
        """Get recent activities for the user"""
        user = request.user
        activities = []
        
        # Get recent audit logs for the user
        recent_logs = AuditLog.objects.filter(
            user=user
        ).order_by('-timestamp')[:10]
        
        for log in recent_logs:
            activities.append({
                'id': log.id,
                'action': log.action,
                'model': log.model_name,
                'timestamp': log.timestamp,
                'details': log.details
            })
        
        return Response(activities)
