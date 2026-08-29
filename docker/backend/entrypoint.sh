#!/bin/sh
set -e

echo "Aplicando migraciones de Django..."
python manage.py migrate --noinput

echo "Iniciando servidor de desarrollo de Django..."
exec python manage.py runserver 0.0.0.0:8000
