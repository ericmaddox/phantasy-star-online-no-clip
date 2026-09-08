/**
 * Sega PRS (LZSS + Huffman-like sliding window) decompression implementation.
 * Used for Phantasy Star Online assets (.prs, .rel, .bml, quest files).
 */
export class PrsDecompressor {
  public static decompress(src: Uint8Array): Uint8Array {
    let srcPos = 0;
    let bitPos = 9;
    let currentByte = 0;

    const dst: number[] = [];

    const getBit = (): number => {
      bitPos--;
      if (bitPos === 0) {
        if (srcPos >= src.length) return 0;
        currentByte = src[srcPos++];
        bitPos = 8;
      }
      return (currentByte >> (8 - bitPos)) & 1;
    };

    while (srcPos < src.length) {
      const bit = getBit();
      if (bit) {
        // Literal byte
        if (srcPos >= src.length) break;
        dst.push(src[srcPos++]);
      } else {
        // Compressed reference
        const shortOrLong = getBit();
        if (shortOrLong) {
          // Short copy or stop
          let offset: number;
          let count: number;

          if (srcPos >= src.length) break;
          const b1 = src[srcPos++];
          if (srcPos >= src.length) break;
          const b2 = src[srcPos++];

          offset = ((b2 & 0xf8) << 5) | b1;
          offset = -((~offset + 1) & 0x1fff);

          count = b2 & 0x07;
          if (count === 0) {
            if (srcPos >= src.length) break;
            count = src[srcPos++] + 1;
          } else {
            count += 2;
          }

          if (offset === 0) {
            // End of stream
            break;
          }

          for (let i = 0; i < count; i++) {
            const readIdx = dst.length + offset;
            if (readIdx >= 0 && readIdx < dst.length) {
              dst.push(dst[readIdx]);
            } else {
              dst.push(0);
            }
          }
        } else {
          // Very short copy
          let count = (getBit() << 1) | getBit();
          count += 2;

          if (srcPos >= src.length) break;
          const offset = -(256 - src[srcPos++]);

          for (let i = 0; i < count; i++) {
            const readIdx = dst.length + offset;
            if (readIdx >= 0 && readIdx < dst.length) {
              dst.push(dst[readIdx]);
            } else {
              dst.push(0);
            }
          }
        }
      }
    }

    return new Uint8Array(dst);
  }
}
