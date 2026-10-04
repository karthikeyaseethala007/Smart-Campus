export interface WiegandParseResult {
  valid: boolean;
  facilityCode?: number;
  cardNumber?: number;
  rawBits: string;
  error?: string;
}

export class WiegandParser {
  /**
   * Decodes a standard 26-bit Wiegand binary frame.
   * Frame layout:
   * Bit 0: Even parity over bits 1-12
   * Bits 1-8: Facility Code (8 bits, 0-255)
   * Bits 9-24: Card/Badge Number (16 bits, 0-65535)
   * Bit 25: Odd parity over bits 13-24
   */
  public static parse26Bit(binaryString: string): WiegandParseResult {
    const cleanBits = binaryString.replace(/[^01]/g, '');

    if (cleanBits.length !== 26) {
      return {
        valid: false,
        rawBits: cleanBits,
        error: `Invalid bit length: expected 26 bits, received ${cleanBits.length}`,
      };
    }

    const firstParityBit = parseInt(cleanBits[0], 10);
    const lastParityBit = parseInt(cleanBits[25], 10);

    const firstHalfBits = cleanBits.substring(1, 13);
    const secondHalfBits = cleanBits.substring(13, 25);

    // 1. Calculate Even Parity over bits 1..12
    const firstHalfOnes = (firstHalfBits.match(/1/g) || []).length;
    const isFirstHalfEven = (firstHalfOnes + firstParityBit) % 2 === 0;

    // 2. Calculate Odd Parity over bits 13..24
    const secondHalfOnes = (secondHalfBits.match(/1/g) || []).length;
    const isSecondHalfOdd = (secondHalfOnes + lastParityBit) % 2 === 1;

    if (!isFirstHalfEven) {
      return {
        valid: false,
        rawBits: cleanBits,
        error: 'Even parity check failed on upper 12 bits',
      };
    }

    if (!isSecondHalfOdd) {
      return {
        valid: false,
        rawBits: cleanBits,
        error: 'Odd parity check failed on lower 12 bits',
      };
    }

    // Extract values
    const facilityCode = parseInt(cleanBits.substring(1, 9), 2);
    const cardNumber = parseInt(cleanBits.substring(9, 25), 2);

    return {
      valid: true,
      facilityCode,
      cardNumber,
      rawBits: cleanBits,
    };
  }

  /**
   * Helper to construct a valid 26-bit Wiegand frame fixture for deterministic tests.
   */
  public static constructFixture(facilityCode: number, cardNumber: number): string {
    const fBits = (facilityCode & 0xFF).toString(2).padStart(8, '0');
    const cBits = (cardNumber & 0xFFFF).toString(2).padStart(16, '0');
    const payload = fBits + cBits;

    const firstHalf = payload.substring(0, 12);
    const secondHalf = payload.substring(12, 24);

    const firstHalfOnes = (firstHalf.match(/1/g) || []).length;
    const p1 = firstHalfOnes % 2 === 0 ? '0' : '1';

    const secondHalfOnes = (secondHalf.match(/1/g) || []).length;
    const p2 = secondHalfOnes % 2 === 1 ? '0' : '1';

    return `${p1}${payload}${p2}`;
  }
}

export default WiegandParser;
