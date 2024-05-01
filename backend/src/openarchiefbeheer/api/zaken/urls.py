from django.urls import path

from .views import ZakenView

app_name = "zaken"

urlpatterns = [
    path("", ZakenView.as_view(), name="zaken"),
]
