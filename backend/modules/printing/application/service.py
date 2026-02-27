import struct

class EscPosBuilder:
    def __init__(self, encoding="cp850"):
        self.buffer = bytearray()
        self.encoding = encoding

    def _encode(self, text: str) -> bytes:
        try:
            return text.encode(self.encoding, errors="replace")
        except LookupError:
            return text.encode("utf-8", errors="replace") # Fallback

    def init(self):
        """Initialize printer"""
        self.buffer.extend(b'\x1b@')
        return self

    def feed(self, n=1):
        """Feed n lines"""
        self.buffer.extend(b'\x1bd' + bytes([n]))
        return self

    def align(self, align="left"):
        """Align center, left, right"""
        vals = {"left": 0, "center": 1, "right": 2}
        self.buffer.extend(b'\x1ba' + bytes([vals.get(align, 0)]))
        return self

    def emphasize(self, on=True):
        """Bold text"""
        val = 1 if on else 0
        self.buffer.extend(b'\x1bE' + bytes([val]))
        return self

    def set_size(self, width=1, height=1):
        """Standard GS ! n size format (0-7)"""
        # width/height 1-8. Raw value: (width-1) * 16 + (height-1)
        w = max(1, min(8, width)) - 1
        h = max(1, min(8, height)) - 1
        n = (w << 4) | h
        self.buffer.extend(b'\x1d!' + bytes([n]))
        return self

    def text(self, text: str):
        """Print text"""
        self.buffer.extend(self._encode(text))
        return self

    def text_ln(self, text: str):
        """Print text and newline"""
        self.buffer.extend(self._encode(text + "\n"))
        return self
    
    def separator(self, char="-", length=48):
        """Print separator line"""
        self.text_ln(char * length)
        return self

    def cut(self, mode="partial"):
        """Cut paper"""
        # Function 66: Feed paper to cut position & cut
        # 0: full, 1: partial (GS V m)
        # 65: full + feed, 66: partial + feed
        m = 66 if mode == "partial" else 65
        self.buffer.extend(b'\x1dV' + bytes([m]) + b'\x00') 
        return self

    def qr_code(self, data: str, size=6):
        """Standard ESC/POS QR Code Model 2"""
        if not data: return self
        
        # 1. Set model (Function 167)
        self.buffer.extend(b'\x1d(k\x04\x001A2\x00')
        # 2. Set module size (Function 169)
        self.buffer.extend(b'\x1d(k\x03\x001C' + bytes([size]))
        # 3. Set error correction level (Function 169) - L=48, M=49, Q=50, H=51
        self.buffer.extend(b'\x1d(k\x03\x001E1')
        
        # 4. Store data (Function 180)
        data_bytes = self._encode(data)
        l = len(data_bytes) + 3
        pl = l % 256
        ph = l // 256
        self.buffer.extend(b'\x1d(k' + bytes([pl, ph]) + b'1P0' + data_bytes)
        
        # 5. Print QR (Function 181)
        self.buffer.extend(b'\x1d(k\x03\x001Q0')
        return self

    def get_bytes(self) -> bytes:
        return bytes(self.buffer)


class ReceiptService:
    @staticmethod
    def generate_receipt_bytes(data, config) -> bytes:
        """
        Generates RAW bytes for a receipt based on data and config.
        """
        builder = EscPosBuilder(encoding=config.encoding)
        w = 48 if config.paper_width == 80 else 32 # approx chars per line
        
        # 1. Init
        builder.init()

        # 2. Header
        builder.align("center")
        builder.set_size(1, 1).emphasize(True)
        builder.text_ln(data.store_name)
        builder.emphasize(False).set_size(1, 1)
        if data.store_address: builder.text_ln(data.store_address)
        if data.store_cuit: builder.text_ln(f"CUIT: {data.store_cuit}")
        if data.store_iva: builder.text_ln(data.store_iva)
        
        builder.feed(1)
        
        # 3. Meta
        builder.align("left")
        builder.text_ln(f"Fecha: {data.date.strftime('%d/%m/%Y %H:%M')}")
        builder.text_ln(f"Ticket: {data.sale_id}")
        if data.customer_name: builder.text_ln(f"Cliente: {data.customer_name}")
        
        builder.product_separator(w)

        # 4. Items
        builder.align("left")
        # Header for items
        # Qty x Price   Total
        # Name
        
        for item in data.items:
            # Line 1: Name (Truncated if too long, or wrapped)
            builder.emphasize(True).text_ln(item.name).emphasize(False)
            
            # Line 2: Qty x Unit Price ... Total
            qty_price = f"{item.qty:.2f} x ${item.price:.2f}"
            total_str = f"${item.total:.2f}"
            
            # Calculate spaces for alignment
            spaces = w - len(qty_price) - len(total_str)
            if spaces < 1: spaces = 1
            
            builder.text_ln(qty_price + (" " * spaces) + total_str)
            # builder.feed(1) # Optional spacing

        builder.product_separator(w)

        # 5. Totals
        builder.align("right")
        builder.emphasize(True).set_size(1, 2) # Double height
        builder.text_ln(f"TOTAL: ${data.total:.2f}")
        builder.set_size(1, 1).emphasize(False)
        
        builder.feed(1)
        builder.align("left")
        for pay in data.payments:
             builder.text_ln(f"Pago: {pay.method} ${pay.amount:.2f}")

        # 6. Footer / QR
        builder.feed(1)
        builder.align("center")
        if data.qr_data:
            builder.qr_code(data.qr_data)
            builder.feed(1)
        
        builder.text_ln("GRACIAS POR SU COMPRA")
        
        # 7. Feed & Cut
        builder.feed(config.feed_lines)
        builder.cut(mode=config.cut_mode)
        
        return builder.get_bytes()

    # Helper function added to builder dynamically or here
    def product_separator(self, w):
        pass

# Monkey patch helper (cleaner than modifying class above mid-string)
def product_separator(self, w):
    self.text_ln("-" * w)

EscPosBuilder.product_separator = product_separator
