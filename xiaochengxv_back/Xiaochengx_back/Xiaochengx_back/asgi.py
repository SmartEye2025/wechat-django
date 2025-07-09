"""
ASGI config for Xiaochengx_back project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os                                                            #用来设置 Django 的配置文件
from django.core.asgi import get_asgi_application                    #Django 处理 HTTP 请求的 ASGI 应用
from channels.routing import ProtocolTypeRouter, URLRouter           #channels.routing：这是 Channels 库中的一个模块，负责定义如何处理不同协议的请求。ProtocolTypeRouter(协议类型路由器): 用于路由不同类型的请求，支持 HTTP、WebSocket 等协议。URLRouter(URL 路由器): 用于定义路由的具体规则，比如 WebSocket 请求的路径和消费者（consumer）映射。
from channels.auth import AuthMiddlewareStack                        #认证中间件栈  用于为 WebSocket 请求提供身份验证和授权中间件
from django.urls import path                                         #定义 URL 路由规则
from Xiaochengx_back import consumers                                #自定义的 WebSocket 消费者类，用于处理 WebSocket 消息

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Xiaochengx_back.settings')   #这一行代码设置了 Django 项目的 settings.py 文件。它告诉 Django 在启动时使用 Xiaochengx_back.settings 文件作为项目的配置文件

application = ProtocolTypeRouter({
    "http": get_asgi_application(),                                     # HTTP 请求走 Django 处理
    "websocket": AuthMiddlewareStack(                                   # WebSocket 请求走 Channels
        URLRouter([
            path("ws/ascend/", consumers.ImageConsumer.as_asgi()),      # WebSocket 路由
        ])
    ),
})
