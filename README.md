## Link Drive
https://docs.google.com/document/d/1rriTV0hRfbk_72Cx8nZTif0IcLVhKzRZr-U500J2qXQ/edit?tab=t.0

## Link de Youtube
https://youtu.be/TSOFzQJn2zI

## Como Ejecutar

-Activar el entorno virtual si no está: ..venv\Scripts\Activate.ps1
-Ejecutar: uvicorn main:app --reload --port 8000


-Revisar que en el .env del frontend apunte a el puerto 8000
-Revisar que este creado el .env en el frontend con las siguientes rutas:
VITE_API_BASE_URL=http://localhost:8000/
VITE_API_URL=http://localhost:8000/
-pnpm run dev
