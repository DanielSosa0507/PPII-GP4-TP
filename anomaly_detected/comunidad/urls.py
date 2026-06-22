from django.urls import path
from .views import TeoriaListCreateView, TeoriaDetailView, VotoTeoriaView

urlpatterns = [
    path('', TeoriaListCreateView.as_view()),
    path('<int:pk>/', TeoriaDetailView.as_view()),
    path('<int:pk>/votar/', VotoTeoriaView.as_view()),
]
