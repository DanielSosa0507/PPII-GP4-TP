from django.urls import path
from .views import (
    FenomenoListCreateView, FenomenoDetailView, ValidacionView, DescargaPDFView,
    FavoritoListCreateView, FavoritoDeleteView,
    VisitaListCreateView, VisitaDeleteView,
    PuntuacionView,
    EnlaceListCreateView, EnlaceDeleteView,
    BasesPorEstadoView,
)

urlpatterns = [
    path('', FenomenoListCreateView.as_view()),
    path('bases-por-estado/', BasesPorEstadoView.as_view()),
    path('<int:pk>/', FenomenoDetailView.as_view()),
    path('<int:pk>/validar/', ValidacionView.as_view()),
    path('<int:pk>/pdf/', DescargaPDFView.as_view()),
    path('<int:pk>/puntuar/', PuntuacionView.as_view()),
    path('<int:pk>/enlaces/', EnlaceListCreateView.as_view()),
    path('enlaces/<int:pk>/', EnlaceDeleteView.as_view()),
    path('favoritos/', FavoritoListCreateView.as_view()),
    path('favoritos/<int:pk>/', FavoritoDeleteView.as_view()),
    path('visitas/', VisitaListCreateView.as_view()),
    path('visitas/<int:pk>/', VisitaDeleteView.as_view()),
]
