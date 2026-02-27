# Sistema de Impresión RAW ESC/POS

Este proyecto utiliza un sistema híbrido de impresión. Por defecto usa la impresión del navegador (PDF/HTML), pero puede configurarse para usar **impresión térmica directa (RAW)** para mayor velocidad y control de corte/apertura de cajón.

## Arquitectura

1.  **Frontend (React)**: Solicita la generación del ticket al Backend.
2.  **Backend (FastAPI)**: Genera los comandos ESC/POS (bytes crudos) basándose en el pedido.
3.  **Bridge Local (Python)**: Un script que corre en la PC del usuario (host) recibe los bytes desde el frontend y los envía directamente a la impresora USB/Red instalada en Windows.

## Prerrequisitos (Cliente Windows)

Para usar la impresión RAW, necesitas ejecutar el **Bridge** en la máquina donde está conectada la impresora.

1.  Instalar Python 3.x en Windows.
2.  Instalar dependencias del bridge:
    ```powershell
    pip install flask pywin32 flask-cors
    ```
3.  Tener la impresora térmica instalada en Windows y **compartida** o con un nombre fácil (ej: `POS-80`).

## Instalación y Ejecución del Bridge

El script del bridge se encuentra en `tools/printer_bridge.py`.

1.  Abrir una terminal en la carpeta del proyecto.
2.  Ejecutar:
    ```powershell
    python tools/printer_bridge.py
    ```
    *Debería decir "Starting Local Printer Bridge on port 3001..."*

## Configuración en el POS

1.  Abrir la aplicación y entrar al POS.
2.  Hacer clic en el ícono de **Impresora** (arriba a la derecha).
3.  Activar "Enable RAW Thermal Printing".
4.  Si el Bridge está corriendo, verás "Status: Connected".
5.  Selecciona tu impresora de la lista.
6.  Configura el ancho (80mm) y el modo de corte.
7.  Guardar.

## Troubleshooting

*   **Status: Bridge Offline**: Verifica que `printer_bridge.py` esté corriendo y que el puerto 3001 no esté bloqueado por el firewall.
*   **No imprime nada**: Verifica que el nombre de la impresora sea correcto. Prueba imprimir una página de prueba de Windows.
*   **Imprime caracteres raros**: Verifica que la codificación en el backend (`service.py`) coincida con la de tu impresora (por defecto `cp850`).
*   **Corte parcial/total no funciona**: Algunos modelos requieren comandos específicos. El sistema usa `GS V` estándar.

## API del Bridge

*   `GET /health`: Estado del servicio.
*   `GET /printers`: Lista impresoras locales.
*   `POST /print`: Envía trabajo de impresión `{ "printer_name": "...", "data": "base64..." }`.
