from rest_framework import serializers

from .models import Documento


class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ["id", "operacion", "tipo", "nombre", "archivo", "fecha_emision", "created_at"]
