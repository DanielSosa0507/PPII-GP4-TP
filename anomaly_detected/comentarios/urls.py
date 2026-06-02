from django.urls import path
from .views import ComentarioListCreateView, ComentarioDeleteView

urlpatterns = [
    path('', ComentarioListCreateView.as_view()),
    path('<int:pk>/', ComentarioDeleteView.as_view()),
]
