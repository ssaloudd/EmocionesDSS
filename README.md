<h1 align="center"> # EmocionesDSS :performing_arts: </h1>

Sistema de detección de emociones en tiempo real usando Django (API), Next.js (Frontend) y un modelo MLP preentrenado.

:construction: Proyecto en construcción :construction:



## :clipboard: Requisitos previos

- Python 3.9+
- Git
- Bun (para frontend)



## Clonar el repositorio
git clone https://github.com/tu_usuario/EmocionesDSS.git



### :rocket: **Backend (Django)**

###     1. Crear y ejecutar un entorno virtual
```
cd EmocionesDSS/emotion-backend
python -m venv venv
venv\Scripts\activate
```

###     2. Instalar dependencias
`pip install -r requirements.txt`

###     3. Aplicar migraciones
```
cd EmocionesDSS/emotion-backend/emotion_api
python manage.py migrate
```

###     4. Ejecutar servidor
`python manage.py runserver`



### :sunrise: **Frontend (Next.js + Bun)**
```
cd EmocionesDSS/emotion-frontend
bun install
bun dev
```



### :star2: **Ejecución**
http://localhost:3000