from django.urls import path
from .views import FenomenoListCreateView, FenomenoDetailView, ValidacionView, DescargaPDFView

urlpatterns = [
    path('', FenomenoListCreateView.as_view()),
    path('<int:pk>/', FenomenoDetailView.as_view()),
    path('<int:pk>/validar/', ValidacionView.as_view()),
    path('<int:pk>/pdf/', DescargaPDFView.as_view()),
]
