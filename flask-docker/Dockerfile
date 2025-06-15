FROM python:3.9-slim

WORKDIR /app

# Copiar requirements.txt desde la raíz del proyecto
COPY requirements.txt ./requirements.txt

# Instalar dependencias
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copiamos el resto de la aplicación al contenedor
COPY . .

# Establecer variable necesaria para predict_flask.py
ENV PROJECT_HOME=/app

EXPOSE 5001

CMD ["python", "predict_flask.py"]


