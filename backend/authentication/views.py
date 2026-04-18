from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import UserRegistrationSerializer, UserLoginSerializer, PasswordChangeSerializer, ProfileUpdateSerializer
from core.models import User, TeacherProfile, StudentProfile, ParentProfile
from core.serializers import UserSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Disable authentication for public signup endpoint

    def create(self, request, *args, **kwargs):
        print(f"[REGISTRATION] Incoming registration request: {request.data.get('username')}, {request.data.get('email')}")
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"[REGISTRATION] Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.save()
        print(f"[REGISTRATION] User created successfully: {user.username}, role: {user.role}")

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserLoginSerializer
    authentication_classes = []  # Disable authentication for public login endpoint

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({
                'error': 'Invalid credentials',
                'detail': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)
        
         # Print the tokens to the console
        access = serializer.validated_data.get('access')
        refresh = serializer.validated_data.get('refresh')
        print(f"[LOGIN DEBUG] Access token: {access}")
        print(f"[LOGIN DEBUG] Refresh token: {refresh}")

        return Response(serializer.validated_data, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        print("[LOGOUT DEBUG] Request user:", request.user)
        print("[LOGOUT DEBUG] Request data:", request.data)
        try:
            refresh_token = request.data["refresh"]
            print("[LOGOUT DEBUG] Refresh token received:", refresh_token)
            token = RefreshToken(refresh_token)
            token.blacklist()
            print("[LOGOUT DEBUG] Token blacklisted successfully.")
            return Response({'message': 'Successfully logged out'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            print("[LOGOUT DEBUG] Exception:", e)
            return Response({'error': 'Invalid token', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = UserSerializer(user).data

        # Add profile data based on role
        profile_data = {}
        try:
            if user.role == 'TEACHER':
                profile = TeacherProfile.objects.get(user=user)
                profile_data = {
                    'employee_id': profile.employee_id,
                    'school': profile.school.name,
                    'subjects': [subject.name for subject in profile.subjects.all()],
                    'sections': [str(section) for section in profile.sections.all()],
                    'qualification': profile.qualification,
                    'experience_years': profile.experience_years
                }
            elif user.role == 'STUDENT':
                profile = StudentProfile.objects.get(user=user)
                profile_data = {
                    'student_id': profile.student_id,
                    'school': profile.school.name,
                    'class': profile.class_assigned.name,
                    'section': profile.section.name,
                    'roll_number': profile.roll_number,
                    'admission_date': profile.admission_date,
                    'blood_group': profile.blood_group,
                    'emergency_contact': profile.emergency_contact
                }
            elif user.role == 'PARENT':
                profile = ParentProfile.objects.get(user=user)
                profile_data = {
                    'children': [
                        {
                            'id': child.id,
                            'name': child.full_name,
                            'student_id': child.student_id,
                            'class': f"{child.class_assigned.name}-{child.section.name}"
                        } for child in profile.children.all()
                    ],
                    'occupation': profile.occupation
                }
        except:
            pass

        return Response({
            'user': user_data,
            'profile': profile_data
        })

class ProfileUpdateView(generics.UpdateAPIView):
    serializer_class = ProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return Response({
            'user': response.data,
            'message': 'Profile updated successfully'
        })