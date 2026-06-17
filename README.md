# Blog Sentimiento 📝🧠

Este es un proyecto Full-Stack desarrollado con **Angular** para el Frontend y **Django** para el Backend. 

## Estructura del Proyecto

El repositorio está dividido en dos carpetas principales:

- `FrontSentimiento/`: Proyecto en Angular.
- `BackSentimiento/`: Proyecto en Django (API).

## Requisitos Previos

- [Node.js](https://nodejs.org/) y npm
- [Python 3](https://www.python.org/)
- [PostgreSQL](https://www.postgresql.org/) y [pgAdmin](https://www.pgadmin.org/) (opcional pero recomendado para la BD)

## Instalación y Configuración

### 1. Frontend (Angular)
Desde la terminal, ubícate en la carpeta del frontend y ejecuta:
```bash
cd FrontSentimiento
npm install
npm start
```
El frontend estará disponible en `http://localhost:4200/`

### 2. Backend (Django)
Desde otra terminal, ubícate en la carpeta del backend, crea tu entorno virtual y levanta el servidor:
```bash
cd BackSentimiento
python -m venv venv
# Activar entorno virtual en Windows:
.\venv\Scripts\activate

# Instalar dependencias (una vez creadas)
pip install django psycopg2-binary

# Correr migraciones e iniciar servidor
python manage.py migrate
python manage.py runserver
```
El backend estará disponible en `http://127.0.0.1:8000/`
