from django.db import models
from django.db.models import Manager
from django.contrib.auth.models import AbstractUser
import os
import uuid


def user_avatar_path(instance, filename):
    # 为上传的头像生成唯一文件名
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('avatars', filename)


# Create your models here.

class User(AbstractUser):
    # 扩展用户模型
    nickname = models.CharField(max_length=50, blank=True, null=True, verbose_name='昵称')
    avatar = models.ImageField(
        upload_to=user_avatar_path,
        blank=True,
        null=True,
        verbose_name='头像',
        default='avatars/default.png'  # 默认头像
    )

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户管理'

    def __str__(self):
        return self.username

    @property
    def avatar_url(self):
        # 如果没有头像，返回默认头像URL
        return self.avatar.url if self.avatar else '/media/avatars/default.png'


# 家长学生绑定关系模型
class ParentStudentBinding(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_bindings', verbose_name='用户', default=1)
    student_id = models.CharField(max_length=100, verbose_name='学生学号')
    student_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='学生姓名')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='绑定时间')
    is_active = models.BooleanField(default=True, verbose_name='是否有效')


    class Meta:
        verbose_name = '用户学生绑定关系'
        verbose_name_plural = '用户学生绑定关系管理'
        unique_together = ('user', 'student_id')  # 确保一个用户不能重复绑定同一个学生

    def __str__(self):
        return f"{self.user.username} -> {self.student_id}"


# 学生信息表
class Student(models.Model):
    object = Manager
    name = models.CharField(max_length=20, verbose_name="姓名")
    student_id = models.CharField(max_length=20,verbose_name="学生ID")
    uwb_id = models.CharField(max_length=20, verbose_name="UWB定位标签id")
    age = models.IntegerField(verbose_name="年龄",default=0)
    speciality = models.CharField(max_length=100,default="无",verbose_name="特殊需求")
    seat_x = models.FloatField(default=0.,verbose_name="座位横坐标")
    seat_y = models.FloatField(default=0., verbose_name="座位纵坐标")

    def __str__(self):
        return self.student_id

# 行为统计表
class Behavior(models.Model):
    object = Manager
    date = models.DateTimeField(auto_now_add=True)

    walk = models.IntegerField(verbose_name="走动",default=0)
    run = models.IntegerField(verbose_name="跑动",default=0)
    lookAround = models.IntegerField(verbose_name="东张西望", default=0)
    offSeat = models.IntegerField(verbose_name="离座", default=0)
    sleeping = models.IntegerField(verbose_name="瞌睡", default=0)
    handup = models.IntegerField(verbose_name="举手", default=0)
    standup = models.IntegerField(verbose_name="起立", default=0)

    def __str__(self):
        return self.date