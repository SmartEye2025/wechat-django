from django.contrib import admin

from .models import User, Student, ParentStudentBinding


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'nickname', 'email', 'is_active')
    search_fields = ('username', 'nickname', 'email')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'name', 'grade', 'class_name')
    search_fields = ('student_id', 'name')
    list_filter = ('grade', 'class_name')


@admin.register(ParentStudentBinding)
class ParentStudentBindingAdmin(admin.ModelAdmin):
    list_display = ('user', 'student_id', 'student_name', 'created_at', 'is_active')
    search_fields = ('user__username', 'student_id', 'student_name')
    list_filter = ('is_active',)
