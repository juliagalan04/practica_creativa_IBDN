# Agile_Data_Code_2 - CARLOTA LÓPEZ Y JULIA GALÁN

Hemos creado un sistema predictivo en tiempo real completo con una interfaz web para enviar solicitudes de predicción de retrasos de vuelos. A continuacióon, detallaremos los pasos para desplegar el entorno:

# Despliegue del entorno

## Paso 1:  Dockerizar cada uno de los servicios que componen la arquitectura completa y desplegar el escenario completo usando docker-compose.

Para comenzar, debemos construir e iniciar los contenedores de todos los servicios. 
```bash
docker-compose up --build
```

Sin embargo, para su correcto funcionamiento debemos primero crear el tópico de kafka donde se almacenarán las peticiones de la predicción.
```bash
docker exec -it kafka kafka-topics.sh \
--create \
--bootstrap-server localhost:9092 \
--replication-factor 1 \
--partitions 1 \
--topic flight-delay-ml-response 
```

Para comprobar que disponemos de todos los conetenedores necesarios, podemos realizar:
```bash
docker ps
```

Así, se deben mostrar todos los servicios desplegados:
- **spark-master**: Nodo maestro de Apache Spark que coordina el trabajo entre las tareas distribuidas (los workers).
- **spark-worker-1 y spark-worker-2**: Nodos workers que ejecutan tareas distribuidas de spark para procesar las predicciones.
- **spark-submit**: Lanza el script MakePrediction.scala, que consume mensajes de Kafka, realiza predicciones y escribe los resultados en MongoDB, Kafka y HDFS.
- **mongo**: Base de datos donde se almacenan los resultados de las predicciones en la colección fligth_delay_ml_response.
- **practica-creativa-flask-1**: Interfaz web para enviar datos a kafka sobre las peticiones de la predicción.
- **kafka**: Sistema de mensajería que que conecta Flask con Spark y NiFi, recibe/envia las peticiones de predicción.    
- **nifi**: Interfaz visual para el diseño y monitoreo de flujos de datos, utilizada para guardar predicciones en un archivo de texto. 
- **proxy**: Servidor Node.js encargado de redirigir tráfico HTTP desde Flask hacia servicios como NiFi.
- **namenode**: Componente central de HDFS, encargado de gestionar el sistema de archivos distribuido, mantener el índice de ficheros y controlar el acceso a los datos, donde Spark intenta escribir los resultados en /user/spark/output.
- **hadoop-datanode**: Nodo trabajador del sistema HDF, encargado de almacenar físicamente los bloques de datos.

Por último, para comprobar el correcto funcionamiento del flujo, debemos acceder  a la interfaz de Flask (http://localhost:5001), ingresar los datos de un vuelo y darle a "Submit". El resultado de la predicción se mostrará en dicha interfaz.

Además, también podemos comprobar que se están escribiendo correctamente las predicciones en MongoDB mediante:
```bash
docker exec -it mongo mongosh
use agile_data_science
show collections
db.flight_delay_ml_response.find()
```

## Paso 2:  Modificar el código para que el resultado de la predicción se escriba en Kafka y se presente en la aplicación (manteniendo MongoDB)

Para realizar este paso, hemos añadido un nuevo DataStreamWriter que publica cada predicción en un topic de Kafka llamado flight-delay-ml-response, manteniendo también MongoDB.

Para comprobar su funcionamiento:
```bash
docker exec -it kafka bash
/opt/bitnami/kafka/bin/kafka-console-consumer.sh \
--bootstrap-server localhost:9092 \
--topic flight-delay-ml-response \
--from-beginning
```

## Paso 3: Desplegar NiFi y definir un flujo para leer cada 10 segundos las predicciones y guardarlas en un fichero txt.

Para ello, accedemos a https://localhost:8443 (usuario: admin, contraseña: 098765432100) y creamos e iniciamos el flujo para leer mensajes del tópico Kafka cada 10 segundos y almacenarlos en el fichero mensajes.txt.

ConsumeKafka_2_0 1.25.0 -- success --> ExecuteStreamCommand 1.25.0 

Los componentes de nuestro flujo son:
**ConsumeKafka_2_0 1.25.0**: 
   - Kafka Brokers: kafka:9092
   - Topic Name(s): fligth-delay-ml-response
   - Group ID: nifi

**ExecuteStreamCommand 1.25.0**: 
   - Command Path: /usr/bin/bash
   - Command Arguments: -c;cat >> /practica_creativa/nifi/mensajes.txt

Para verificar su funcionamiento:
```bash
docker exec -it nifi bash
ls -l /practica_creativa/nifi/mensajes.txt
```

## Paso 4: Escribir las predicciones en HDFS en lugar de MongoDB.
En este paso también hemos añadido un nuevo DataStreamWriter para, además de escribir los resultados en MongoDB y Kafka, que también se escriban en HDFS en formato .parquet. 

La ruta de destino es Ruta destino: hdfs://namenode:9000/user/spark/output, accesible desde Hadoop, y el checkpoint del stream se guarda en /tmp/hdfs_checkpoint.

Para verificar que los archivos .parquet se estén creando:
```bash
docker exec -it namenode bash
hdfs dfs -ls /user/spark/output
```

Por otro lado, para comprobar su funcionamiento desde la interfaz web de Hadoop, debemos acceder a http://localhost:9870, ir a sección de Utilities y Browse the file system, y acceder a la ruta /user/spark/output, donde se deben guardar y visualizar los ficheros Parquet. 

Los archivos .parquet deben aparecer con timestamps recientes, confirmando que el flujo está funcionando:
Flask ➜ Kafka ➜ Spark ➜ HDFS
