from django.shortcuts import HttpResponse
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone

from .models import ParentStudentBinding
from .models import User
from .models import Student


import json
import random
import re
import os
from django.conf import settings

# Create your views here.

def generate_verification_code():
    """生成6位数验证码"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def validate_phone(phone):
    """验证手机号格式"""
    pattern = r'^1[3-9]\d{9}$'
    return re.match(pattern, phone) is not None

@csrf_exempt
def send_verification_code(request):
    """发送验证码"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            phone = data.get('phone')
            
            # 验证手机号
            if not validate_phone(phone):
                return JsonResponse({
                    'status': 'error', 
                    'message': '手机号格式不正确'
                }, status=400)
            
            # 检查手机号是否已注册
            if User.objects.filter(phone=phone).exists():
                return JsonResponse({
                    'status': 'error', 
                    'message': '该手机号已注册'
                }, status=400)
            
            # 生成验证码
            code = generate_verification_code()
            
            # TODO: 实际应用中接入短信服务发送验证码
            # 这里仅做模拟
            print(f"验证码发送成功：{code}")
            
            # 创建临时用户或保存验证码
            user, created = User.objects.get_or_create(
                phone=phone,
                defaults={
                    'username': phone,
                    'verification_code': code,
                    'verification_code_expires_at': timezone.now() + timezone.timedelta(minutes=10)
                }
            )
            
            if not created:
                user.verification_code = code
                user.verification_code_expires_at = timezone.now() + timezone.timedelta(minutes=10)
                user.save()
            
            return JsonResponse({
                'status': 'success', 
                'message': '验证码发送成功'
            })
        
        except Exception as e:
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)
    
    return JsonResponse({'status': 'error', 'message': '无效请求'}, status=405)

@csrf_exempt
def register(request):
    """用户注册"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            phone = data.get('phone')
            code = data.get('code')
            password = data.get('password')
            nickname = data.get('nickname', '')
            
            # 验证手机号和验证码
            try:
                user = User.objects.get(phone=phone)
            except User.DoesNotExist:
                return JsonResponse({
                    'status': 'error', 
                    'message': '请先获取验证码'
                }, status=400)
            
            # # 验证码校验
            # if not user.is_verification_code_valid(code):
            #     return JsonResponse({
            #         'status': 'error',
            #         'message': '验证码错误或已过期'
            #     }, status=400)
            
            # 设置用户信息
            user.set_password(password)
            user.nickname = nickname
            user.phone_verified = True
            user.verification_code = None
            user.verification_code_expires_at = None
            user.save()
            
            return JsonResponse({
                'status': 'success', 
                'message': '注册成功',
                'user': {
                    'username': user.username,
                    'nickname': user.nickname
                }
            })
        
        except Exception as e:
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)
    
    return JsonResponse({'status': 'error', 'message': '无效请求'}, status=405)

def index(request):
    return HttpResponse("_____")

@csrf_exempt
def user_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            user = authenticate(username=username, password=password)
            
            if user is not None:
                login(request, user)
                return JsonResponse({
                    'status': 'success', 
                    'message': '登录成功',
                    'user': {
                        'username': user.username,
                        'nickname': user.nickname
                    }
                })
            else:
                return JsonResponse({
                    'status': 'error', 
                    'message': '用户名或密码错误'
                }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=500)
    return JsonResponse({'status': 'error', 'message': '无效请求'}, status=405)

def user_logout(request):
    logout(request)
    return JsonResponse({'status': 'success', 'message': '注销成功'})


@csrf_exempt
def update_profile(request):
    """
    一个简化的更新用户昵称和头像的接口，仅用于测试。
    需要通过 POST 请求传递 'username' 来指定要更新的用户。
    """
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': '仅支持POST请求'}, status=405)

    try:
        username = request.POST.get('username')
        if not username:
            return JsonResponse({'status': 'error', 'message': '必须提供username参数'}, status=400)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': '用户不存在'}, status=404)

        # 更新昵称
        nickname = request.POST.get('nickname')
        if nickname is not None:
            user.nickname = nickname

        # 更新头像
        avatar_file = request.FILES.get('avatar')
        if avatar_file:
            user.avatar = avatar_file

        user.save()

        return JsonResponse({
            'status': 'success',
            'message': '用户信息更新成功',
            'user': {
                'username': user.username,
                'nickname': user.nickname,
                'avatar_url': request.build_absolute_uri(user.avatar.url) if user.avatar else None,
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def update_avatar(request):
    try:
        username = request.POST.get('username')
        avatar_file = request.FILES.get('avatar')

        if not username or not avatar_file:
            return JsonResponse({'code': 400, 'message': '参数缺失'})

        # 获取用户信息
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({'code': 404, 'message': '用户不存在'})

        # 删除旧头像（如果不是默认头像）
        if user.avatar and 'default.png' not in str(user.avatar):
            old_avatar_path = os.path.join(settings.MEDIA_ROOT, str(user.avatar))
            if os.path.exists(old_avatar_path):
                os.remove(old_avatar_path)

        # 保存新头像
        user.avatar = avatar_file
        user.save()

        return JsonResponse({
            'code': 200,
            'message': '头像更新成功',
            'data': {
                'avatar_url': request.build_absolute_uri(user.avatar.url) if user.avatar else None,
            }
        })
    except Exception as e:
        return JsonResponse({'code': 500, 'message': str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def update_nickname(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        nickname = data.get('nickname')

        if not username or not nickname:
            return JsonResponse({'code': 400, 'message': '参数缺失'})

        # 获取用户信息
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({'code': 404, 'message': '用户不存在'})
            
        user.nickname = nickname
        user.save()

        return JsonResponse({
            'code': 200,
            'message': '昵称更新成功',
            'data': {
                'nickname': nickname
            }
        })
    except Exception as e:
        return JsonResponse({'code': 500, 'message': str(e)})

@require_http_methods(["GET"])
def get_user_info(request):
    try:
        username = request.GET.get('username')
        if not username:
            return JsonResponse({'code': 400, 'message': '参数缺失'})

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({'code': 404, 'message': '用户不存在'})
            
        avatar_url = request.build_absolute_uri(user.avatar.url) if user.avatar else ''

        return JsonResponse({
            'code': 200,
            'data': {
                'nickname': user.nickname,
                'avatar_url': avatar_url
            }
        })
    except Exception as e:
        return JsonResponse({'code': 500, 'message': str(e)})

@csrf_exempt
def bind_student(request):
    """用户绑定学生账号"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')  # 使用用户名
            student_id = data.get('student_id')

            if not username or not student_id:
                return JsonResponse({
                    'status': 'error',
                    'message': '缺少必要参数'
                }, status=400)

            # 获取用户对象
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': '用户不存在'
                }, status=404)

            # 检查用户是否已经绑定了其他学生
            if ParentStudentBinding.objects.filter(user=user, is_active=True).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': '您已经绑定了一个孩子，一个用户只能绑定一个孩子'
                }, status=400)

            # 检查学生是否已经被其他用户绑定
            if ParentStudentBinding.objects.filter(student_id=student_id, is_active=True).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': '该学号已经被其他用户绑定'
                }, status=400)

            # 检查学生是否存在
            try:
                student = Student.objects.get(student_id=student_id)
                student_name = student.name
            except Student.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': '未找到该学号对应的学生'
                }, status=404)

            # 创建绑定关系
            existing_binding = ParentStudentBinding.objects.filter(user=user, student_id=student_id).first()

            if existing_binding:
                # 如果有之前的绑定记录，重新激活它
                existing_binding.is_active = True
                existing_binding.student_name = student_name  # 更新学生姓名，以防学生信息有变更
                existing_binding.save()
                binding = existing_binding
            else:
                # 如果没有之前的绑定记录，创建新的绑定关系
                binding = ParentStudentBinding.objects.create(
                    user=user,
                    student_id=student_id,
                    student_name=student_name
                )

            return JsonResponse({
                'status': 'success',
                'message': '绑定成功',
                'data': {
                    'has_binding': True,
                    'username': user.username,
                    'student_id': student_id,
                    'student_name': student_name
                }
            })

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

    return JsonResponse({'status': 'error', 'message': '无效请求'}, status=405)



@csrf_exempt
def unbind_student(request):
    """解除用户学生绑定关系"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')

            if not username:
                return JsonResponse({
                    'status': 'error',
                    'message': '缺少必要参数'
                }, status=400)

            # 获取用户对象
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': '用户不存在'
                }, status=404)

            # 查找并解除绑定关系
            try:
                binding = ParentStudentBinding.objects.get(user=user, is_active=True)
                binding.is_active = False
                binding.save()

                return JsonResponse({
                    'status': 'success',
                    'message': '解除绑定成功'
                })
            except ParentStudentBinding.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': '未找到绑定关系'
                }, status=400)

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

    return JsonResponse({'status': 'error', 'message': '无效请求'}, status=405)


@csrf_exempt
def get_binding_info(request):
    """获取绑定关系信息"""
    if request.method == 'GET':
        try:
            username = request.GET.get('username')

            if not username:
                return JsonResponse({
                    'status': 'error',
                    'message': '缺少必要参数'
                }, status=400)

            # 获取用户对象
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': '用户不存在'
                }, status=404)

            # 查询用户绑定的学生
            try:
                binding = ParentStudentBinding.objects.get(user=user, is_active=True)
                return JsonResponse({
                    'status': 'success',
                    'data': {
                        'has_binding': True,
                        'student_id': binding.student_id,
                        'student_name': binding.student_name,
                        'binding_time': binding.created_at.strftime('%Y-%m-%d %H:%M:%S')
                    }
                })
            except ParentStudentBinding.DoesNotExist:
                return JsonResponse({
                    'status': 'success',
                    'data': {
                        'has_binding': False
                    }
                })

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

    return JsonResponse({'status': 'error', 'message': '无效请求'}, status=405)


@csrf_exempt
def add_student(request):
    """添加学生信息"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            student_id = data.get('student_id')
            name = data.get('name')
            grade = data.get('grade', '')
            class_name = data.get('class_name', '')

            if not student_id or not name:
                return JsonResponse({
                    'status': 'error',
                    'message': '学号和姓名不能为空'
                }, status=400)

            # 检查学号是否已存在
            if Student.objects.filter(student_id=student_id).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': '该学号已存在'
                }, status=400)

            # 创建学生记录
            student = Student.objects.create(
                student_id=student_id,
                name=name,
                grade=grade,
                class_name=class_name
            )

            return JsonResponse({
                'status': 'success',
                'message': '学生信息添加成功',
                'data': {
                    'student_id': student.student_id,
                    'name': student.name
                }
            })

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

    return JsonResponse({'status': 'error', 'message': '无效请求'}, status=405)


@csrf_exempt
def get_student_info(request):
    """根据学号获取学生信息"""
    if request.method == 'GET':
        try:
            student_id = request.GET.get('student_id')

            if not student_id:
                return JsonResponse({
                    'status': 'error',
                    'message': '缺少学号参数'
                }, status=400)

            try:
                student = Student.objects.get(student_id=student_id)
                return JsonResponse({
                    'status': 'success',
                    'data': {
                        'student_id': student.student_id,
                        'name': student.name
                    }
                })
            except Student.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': '未找到该学号对应的学生'
                }, status=404)

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

    return JsonResponse({'status': 'error', 'message': '无效请求'}, status=405)


@csrf_exempt
def list_students(request):
    """获取学生列表"""
    if request.method == 'GET':
        try:
            grade = request.GET.get('grade')
            class_name = request.GET.get('class_name')

            students = Student.objects.all()

            if grade:
                students = students.filter(grade=grade)
            if class_name:
                students = students.filter(class_name=class_name)

            students_data = []
            for student in students:
                students_data.append({
                    'student_id': student.student_id,
                    'name': student.name
                })

            return JsonResponse({
                'status': 'success',
                'data': students_data
            })

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

    return JsonResponse({'status': 'error', 'message': '无效请求'}, status=405)