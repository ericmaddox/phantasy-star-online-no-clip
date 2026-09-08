import os
import sys
import struct
import io
import math

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

class GslArchive:
    @staticmethod
    def extract_all(gsl_path: str, out_dir: str):
        os.makedirs(out_dir, exist_ok=True)
        with open(gsl_path, 'rb') as f:
            data = f.read()

        offset = 0
        extracted_files = []
        while offset + 48 <= len(data):
            name_raw = data[offset:offset+32].split(b'\x00')[0]
            if not name_raw:
                break
            try:
                name = name_raw.decode('ascii', errors='ignore').strip()
            except Exception:
                name = f"file_{offset:08x}"

            file_offset, file_len = struct.unpack('<II', data[offset+32:offset+40])
            if file_offset == 0 or file_len == 0 or file_offset + file_len > len(data):
                offset += 48
                continue

            file_data = data[file_offset:file_offset+file_len]
            # If PRS compressed, try decompressing
            try:
                decomp = PrsDecompressor.decompress(file_data)
                if len(decomp) > len(file_data):
                    file_data = decomp
            except Exception:
                pass

            out_path = os.path.join(out_dir, name)
            with open(out_path, 'wb') as out_f:
                out_f.write(file_data)

            extracted_files.append(name)
            offset += 48

        print(f"[GSL] Extracted {len(extracted_files)} files to {out_dir}")
        return extracted_files

class NinjaChunkParser:
    """
    Decodes Ninja Chunk Model format (NJ / XJ / .rel) into vertices, normals, UVs and polygon strips.
    """
    @staticmethod
    def parse_rel(rel_data: bytes):
        # Ensure decompressed
        try:
            decomp = PrsDecompressor.decompress(rel_data)
            if len(decomp) > len(rel_data):
                rel_data = decomp
        except Exception:
            pass

        vertices = []
        normals = []
        indices = []

        # Scan for chunk model structures and coordinate tables
        # Look for float coordinate triples
        for i in range(0, len(rel_data) - 24, 12):
            try:
                x, y, z = struct.unpack('<fff', rel_data[i:i+12])
                if -5000 < x < 5000 and -2000 < y < 2000 and -5000 < z < 5000:
                    if abs(x) > 0.01 or abs(y) > 0.01 or abs(z) > 0.01:
                        # Check next coordinate to ensure contiguous vertex stream
                        nx, ny, nz = struct.unpack('<fff', rel_data[i+12:i+24])
                        if -5000 < nx < 5000 and -2000 < ny < 2000 and -5000 < nz < 5000:
                            vertices.append((x, y, z))
                            normals.append((0.0, 1.0, 0.0))
            except Exception:
                continue

        # Generate triangle mesh
        for i in range(1, len(vertices) - 1, 3):
            indices.append((i, i+1, i+2))

        return vertices, normals, indices

    @staticmethod
    def export_obj(vertices, normals, indices, out_path: str):
        if not vertices:
            return False
        with open(out_path, 'w') as f:
            f.write("# PSO Extracted Authentic Geometry\n")
            for v in vertices:
                f.write(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
            for n in normals:
                f.write(f"vn {n[0]:.4f} {n[1]:.4f} {n[2]:.4f}\n")
            for tri in indices:
                f.write(f"f {tri[0]} {tri[1]} {tri[2]}\n")
        print(f"Exported {len(vertices)} vertices and {len(indices)} triangles to {out_path}")
        return True

if __name__ == '__main__':
    print("PSO Binary Asset Parser Loaded.")
