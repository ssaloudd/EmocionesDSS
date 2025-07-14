<h1 align="center"> # EmocionesDSS :performing_arts: </h1>

Sistema de detección de emociones en tiempo real usando Django (API), Next.js (Frontend) y un modelo MLP preentrenado.

:construction: Proyecto en construcción :construction:



## :clipboard: Requisitos previos

- Python 3.9+
- Git
- Bun (para frontend)

- **OJO: Se debe clonar el repositorio en el disco C para que la ruta sea corta y no hayan problemas posteriormente.**


## Clonar el repositorio
```
git clone https://github.com/tu_usuario/EmocionesDSS.git
```


### :rocket: **Backend (Django)**

###     1. Crear y ejecutar un entorno virtual
```
cd EmocionesDSS/emotion-backend
python -m venv venv
venv\Scripts\activate
```

###     2. Instalar dependencias
```
cd EmocionesDSS/emotion-backend
pip install -r requirements.txt
pip install tensorflow
```

###     3. Aplicar migraciones
```
cd EmocionesDSS/emotion-backend
venv\Scripts\activate

cd EmocionesDSS/emotion-backend/emotion_api
python manage.py makemigrations api
python manage.py migrate
```

###     4. Crear super-usuario
Aún dentro del directorio `EmocionesDSS/emotion-backend/emotion_api` se puede crear el usuario administrador:
```
python manage.py createsuperuser
```
Llenar con los datos pedidos en consola (para desarrollo solo poner como `Username: admin`, `Email address: admin@admin.com` y `Password: admin`)

###     5. Ejecutar servidor
Con el entorno virtual activo:
```
python manage.py runserver
```


### :sunrise: **Frontend (Next.js + Bun)**
Al mismo tiempo, en una nueva terminal:
```
cd EmocionesDSS/emotion-frontend
bun install
bun dev
```


### :star2: **Ejecución**
http://localhost:3000/detection