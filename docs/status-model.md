# Modelo de estados de caso (vigente)

Estados soportados:

- en revisión
- enviado a funcionario
- descargos recibidos
- enviado a Dirección
- respuesta de Dirección recibida
- respuesta enviada
- archivado (valor técnico: `archivado`)

Notas:

- Eliminados: `pendiente info usuario`, `cerrado`.
- En la UI, el estado final se muestra como "Archivado" y corresponde al valor persistido `archivado`.
- Las reglas de Firestore y los seeds ya están alineados con este set.
