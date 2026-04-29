---
name: comment-code
description: >
  Automatiza la documentación del código mediante comentarios profesionales sin alterar la lógica.
  Trigger: Cuando el usuario pida documentar, comentar o explicar código.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Cuando el código fuente carece de documentación profesional.
- Para explicar funciones, clases o bloques de lógica compleja.
- Antes de entregar un Change o al finalizar una tarea.

## Critical Patterns

- **No alterar la lógica**: Nunca modificar líneas de código, imports, exports ni estructura.
- **Formato**:
    - Python: `#` para comentarios simples, `""" """` para clases y funciones (docstrings).
    - JS/TS: `//` para comentarios simples, `/** */` (JSDoc) para funciones y clases.
- **Acción**: Sobreescribir el archivo original únicamente con los comentarios insertados.
- **Exclusiones**: No procesar `node_modules`, `dist`, `__pycache__`, `.venv` o archivos de configuración (`.env`, `alembic.ini`).

## Commands

```bash
# Para aplicar a un archivo específico
# (Como agente, simplemente leé el archivo y escribí la versión comentada)
```

## Resources

- **Documentación**: Ver el estilo de comentarios definido en la Spec 5.0 (Apéndice).
