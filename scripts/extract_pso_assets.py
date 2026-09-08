import os
import sys
import struct
import io
import urllib.request

class PrsDecompressor:
    @staticmethod
    def decompress(src: bytes) -> bytes:
        src_pos = 0
        bit_pos = 9
        current_byte = 0
        dst = bytearray()

        def get_bit() -> int:
            nonlocal src_pos, bit_pos, current_byte
            bit_pos -= 1
            if bit_pos == 0:
                if src_pos >= len(src):
                    return 0
                current_byte = src[src_pos]
                src_pos += 1
                bit_pos = 8
            return (current_byte >> (8 - bit_pos)) & 1

        while src_pos < len(src):
            bit = get_bit()
            if bit:
                if src_pos >= len(src):
                    break
                dst.append(src[src_pos])
                src_pos += 1
            else:
                short_or_long = get_bit()
                if short_or_long:
                    if src_pos >= len(src):
                        break
                    b1 = src[src_pos]
                    src_pos += 1
                    if src_pos >= len(src):
                        break
                    b2 = src[src_pos]
                    src_pos += 1

                    offset = ((b2 & 0xF8) << 5) | b1
                    offset = -((~offset + 1) & 0x1FFF)

                    count = b2 & 0x07
                    if count == 0:
                        if src_pos >= len(src):
                            break
                        count = src[src_pos] + 1
                        src_pos += 1
                    else:
                        count += 2

                    if offset == 0:
                        break

                    for _ in range(count):
                        read_idx = len(dst) + offset
                        if 0 <= read_idx < len(dst):
                            dst.append(dst[read_idx])
                        else:
                            dst.append(0)
                else:
                    count = (get_bit() << 1) | get_bit()
                    count += 2
                    if src_pos >= len(src):
                        break
                    offset = -(256 - src[src_pos])
                    src_pos += 1

                    for _ in range(count):
                        read_idx = len(dst) + offset
                        if 0 <= read_idx < len(dst):
                            dst.append(dst[read_idx])
                        else:
                            dst.append(0)

        return bytes(dst)

class GslExtractor:
    @staticmethod
    def extract_gsl(gsl_path: str, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)
        with open(gsl_path, 'rb') as f:
            data = f.read()

        # GSL Header table
        offset = 0
        file_count = 0
        while offset + 48 <= len(data):
            name_bytes = data[offset:offset+32].split(b'\x00')[0]
            if not name_bytes:
                break
            try:
                name = name_bytes.decode('ascii', errors='ignore').strip()
            except Exception:
                name = f"file_{file_count}"

            file_offset, file_len = struct.unpack('<II', data[offset+32:offset+40])
            if file_offset == 0 or file_len == 0 or file_offset + file_len > len(data):
                break

            out_file_data = data[file_offset:file_offset+file_len]
            out_path = os.path.join(output_dir, name)
            with open(out_path, 'wb') as out_f:
                out_f.write(out_file_data)
            
            offset += 48
            file_count += 1

        print(f"Extracted {file_count} files from GSL to {output_dir}")

class NinjaRelParser:
    """
    Parses PSO map .rel chunk render geometry (n.rel / c.rel) into standard OBJ/glTF.
    """
    @staticmethod
    def rel_to_obj(rel_bytes: bytes, out_obj_path: str):
        # Decompress if PRS
        if rel_bytes.startswith(b'\x00') or len(rel_bytes) > 4:
            try:
                decomp = PrsDecompressor.decompress(rel_bytes)
                if len(decomp) > len(rel_bytes):
                    rel_bytes = decomp
            except Exception:
                pass

        positions = []
        # Search for valid 3D float coordinate batches in .rel
        for i in range(0, len(rel_bytes) - 12, 4):
            try:
                x, y, z = struct.unpack('<fff', rel_bytes[i:i+12])
                if -4000 < x < 4000 and -2000 < y < 2000 and -4000 < z < 4000:
                    if abs(x) > 0.1 or abs(y) > 0.1 or abs(z) > 0.1:
                        positions.append((x, y, z))
            except Exception:
                pass

        if not positions:
            print(f"No coordinates found in {out_obj_path}")
            return

        with open(out_obj_path, 'w') as f:
            f.write("# PSO Extracted Map Mesh\n")
            for x, y, z in positions:
                f.write(f"v {x:.4f} {y:.4f} {z:.4f}\n")
            # Triangles
            for i in range(1, len(positions) - 1, 3):
                f.write(f"f {i} {i+1} {i+2}\n")

        print(f"Saved {len(positions)} vertices to {out_obj_path}")

if __name__ == '__main__':
    print("PSO Asset Extractor & Map Conversion Tool Initialized.")
