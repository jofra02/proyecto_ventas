import sys
import base64
import win32print
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Allow requests from frontend

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "AntiGravity Local Printer Bridge"})

@app.route('/printers', methods=['GET'])
def list_printers():
    try:
        # EnumPrinters(Flags, Name, Level)
        # Flags: PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS
        flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        printers = win32print.EnumPrinters(flags, None, 2)
        printer_list = [{"name": p['pPrinterName'], "port": p['pPortName']} for p in printers]
        return jsonify(printer_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/print', methods=['POST'])
def print_raw():
    data = request.json
    printer_name = data.get('printer_name')
    raw_b64 = data.get('data')

    if not printer_name or not raw_b64:
        return jsonify({"error": "Missing printer_name or data"}), 400

    try:
        raw_bytes = base64.b64decode(raw_b64)
    except Exception as e:
        return jsonify({"error": "Invalid base64 data"}), 400

    try:
        hPrinter = win32print.OpenPrinter(printer_name)
        try:
            hJob = win32print.StartDocPrinter(hPrinter, 1, ("AntiGravity Receipt", None, "RAW"))
            try:
                win32print.StartPagePrinter(hPrinter)
                win32print.WritePrinter(hPrinter, raw_bytes)
                win32print.EndPagePrinter(hPrinter)
            finally:
                win32print.EndDocPrinter(hPrinter)
        finally:
            win32print.ClosePrinter(hPrinter)
        
        return jsonify({"status": "success", "message": "Job sent to printer"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Local Printer Bridge on port 3001...")
    # Run on port 3001 to avoid conflict with React (5173) or Backend (8000)
    app.run(port=3001, host='0.0.0.0')
