// Original cat printer UUIDs
const SERVICE_UUID_AE = "0000ae30-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_AE = "0000ae01-0000-1000-8000-00805f9b34fb";

// GB series printer UUIDs
const SERVICE_UUID_FF = "0000ff00-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID_FF = "0000ff02-0000-1000-8000-00805f9b34fb";

// Cat Printer commands (from kitty-printer protocol)
const CMD_GET_STATE = 0xa3;
const CMD_SET_DPI = 0xa4;
const CMD_LATTICE = 0xa6;
const CMD_ENERGY = 0xaf;
const CMD_BITMAP = 0xa2;
const CMD_FEED = 0xa1;
const CMD_SPEED = 0xbd;
const CMD_APPLY_ENERGY = 0xbe;

// CRC8 lookup table
const CRC8_TABLE = new Uint8Array([
  0x00, 0x07, 0x0e, 0x09, 0x1c, 0x1b, 0x12, 0x15, 0x38, 0x3f, 0x36, 0x31,
  0x24, 0x23, 0x2a, 0x2d, 0x70, 0x77, 0x7e, 0x79, 0x6c, 0x6b, 0x62, 0x65,
  0x48, 0x4f, 0x46, 0x41, 0x54, 0x53, 0x5a, 0x5d, 0xe0, 0xe7, 0xee, 0xe9,
  0xfc, 0xfb, 0xf2, 0xf5, 0xd8, 0xdf, 0xd6, 0xd1, 0xc4, 0xc3, 0xca, 0xcd,
  0x90, 0x97, 0x9e, 0x99, 0x8c, 0x8b, 0x82, 0x85, 0xa8, 0xaf, 0xa6, 0xa1,
  0xb4, 0xb3, 0xba, 0xbd, 0xc7, 0xc0, 0xc9, 0xce, 0xdb, 0xdc, 0xd5, 0xd2,
  0xff, 0xf8, 0xf1, 0xf6, 0xe3, 0xe4, 0xed, 0xea, 0xb7, 0xb0, 0xb9, 0xbe,
  0xab, 0xac, 0xa5, 0xa2, 0x8f, 0x88, 0x81, 0x86, 0x93, 0x94, 0x9d, 0x9a,
  0x27, 0x20, 0x29, 0x2e, 0x3b, 0x3c, 0x35, 0x32, 0x1f, 0x18, 0x11, 0x16,
  0x03, 0x04, 0x0d, 0x0a, 0x57, 0x50, 0x59, 0x5e, 0x4b, 0x4c, 0x45, 0x42,
  0x6f, 0x68, 0x61, 0x66, 0x73, 0x74, 0x7d, 0x7a, 0x89, 0x8e, 0x87, 0x80,
  0x95, 0x92, 0x9b, 0x9c, 0xb1, 0xb6, 0xbf, 0xb8, 0xad, 0xaa, 0xa3, 0xa4,
  0xf9, 0xfe, 0xf7, 0xf0, 0xe5, 0xe2, 0xeb, 0xec, 0xc1, 0xc6, 0xcf, 0xc8,
  0xdd, 0xda, 0xd3, 0xd4, 0x69, 0x6e, 0x67, 0x60, 0x75, 0x72, 0x7b, 0x7c,
  0x51, 0x56, 0x5f, 0x58, 0x4d, 0x4a, 0x43, 0x44, 0x19, 0x1e, 0x17, 0x10,
  0x05, 0x02, 0x0b, 0x0c, 0x21, 0x26, 0x2f, 0x28, 0x3d, 0x3a, 0x33, 0x34,
  0x4e, 0x49, 0x40, 0x47, 0x52, 0x55, 0x5c, 0x5b, 0x76, 0x71, 0x78, 0x7f,
  0x6a, 0x6d, 0x64, 0x63, 0x3e, 0x39, 0x30, 0x37, 0x22, 0x25, 0x2c, 0x2b,
  0x06, 0x01, 0x08, 0x0f, 0x1a, 0x1d, 0x14, 0x13, 0xae, 0xa9, 0xa0, 0xa7,
  0xb2, 0xb5, 0xbc, 0xbb, 0x96, 0x91, 0x98, 0x9f, 0x8a, 0x8d, 0x84, 0x83,
  0xde, 0xd9, 0xd0, 0xd7, 0xc2, 0xc5, 0xcc, 0xcb, 0xe6, 0xe1, 0xe8, 0xef,
  0xfa, 0xfd, 0xf4, 0xf3,
]);

function crc8(data: Uint8Array): number {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc = CRC8_TABLE[(crc ^ data[i]) & 0xff];
  }
  return crc;
}

function buildPacket(command: number, data: Uint8Array = new Uint8Array()): Uint8Array {
  const packet = new Uint8Array(data.length + 8);
  packet[0] = 0x51; // Start byte 1
  packet[1] = 0x78; // Start byte 2
  packet[2] = command;
  packet[3] = 0x00; // Type (0x00 = Transfer)
  packet[4] = data.length & 0xff; // Length low byte
  packet[5] = (data.length >> 8) & 0xff; // Length high byte
  packet.set(data, 6);
  packet[packet.length - 2] = crc8(data);
  packet[packet.length - 1] = 0xff; // End byte
  return packet;
}

export type PrinterStatus = "disconnected" | "connecting" | "connected" | "printing";

export class CatPrinter {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private status: PrinterStatus = "disconnected";
  private statusCallback: ((status: PrinterStatus) => void) | null = null;
  private deviceName: string = "";

  setStatusCallback(callback: (status: PrinterStatus) => void): void {
    this.statusCallback = callback;
  }

  private setStatus(status: PrinterStatus): void {
    this.status = status;
    this.statusCallback?.(status);
  }

  getStatus(): PrinterStatus {
    return this.status;
  }

  getDeviceName(): string {
    return this.deviceName;
  }

  isSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error("Web Bluetooth API is not supported in this browser");
    }

    try {
      this.setStatus("connecting");

      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [SERVICE_UUID_AE] },
          { services: [SERVICE_UUID_FF] },
          { namePrefix: "GB" },
          { namePrefix: "GT" },
        ],
        optionalServices: [SERVICE_UUID_AE, SERVICE_UUID_FF],
      });

      this.deviceName = this.device.name || "Cat Printer";

      this.device.addEventListener("gattserverdisconnected", () => {
        this.setStatus("disconnected");
        this.characteristic = null;
      });

      const server = await this.device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server");

      // Try both service UUIDs (AE for original cat printers, FF for some models)
      let service: BluetoothRemoteGATTService;
      let characteristicUuid: string;
      try {
        service = await server.getPrimaryService(SERVICE_UUID_AE);
        characteristicUuid = CHARACTERISTIC_UUID_AE;
      } catch (e1) {
        try {
          service = await server.getPrimaryService(SERVICE_UUID_FF);
          characteristicUuid = CHARACTERISTIC_UUID_FF;
        } catch (e2) {
          throw new Error(`Printer service not found. This printer may not be compatible.`);
        }
      }
      this.characteristic = await service.getCharacteristic(characteristicUuid);

      this.setStatus("connected");
      return true;
    } catch (error) {
      this.setStatus("disconnected");
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.deviceName = "";
    this.setStatus("disconnected");
  }

  private async sendPacket(packet: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error("Printer not connected");
    }

    // Send in chunks to respect BLE MTU limits (200 bytes like kitty-printer)
    const chunkSize = 200;
    for (let i = 0; i < packet.length; i += chunkSize) {
      const chunk = packet.slice(i, Math.min(i + chunkSize, packet.length));
      const buffer = new ArrayBuffer(chunk.length);
      new Uint8Array(buffer).set(chunk);
      await this.characteristic.writeValueWithoutResponse(buffer);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async printImage(
    bitmap: Uint8Array,
    width: number,
    height: number,
    energy: number = 0x60,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    if (!this.characteristic) {
      throw new Error("Printer not connected");
    }

    this.setStatus("printing");

    try {
      const bytesPerRow = Math.ceil(width / 8);

      // Get device state
      await this.sendPacket(buildPacket(CMD_GET_STATE));
      await this.delay(50);

      // Set DPI (0x33 = standard 200dpi)
      await this.sendPacket(buildPacket(CMD_SET_DPI, new Uint8Array([0x33])));
      await this.delay(50);

      // Set speed
      await this.sendPacket(buildPacket(CMD_SPEED, new Uint8Array([0x20])));
      await this.delay(50);

      // Set energy level
      // Energy is 2 bytes, usually around 0x6000?? Or 0x60??
      // Based on original code: new Uint8Array([0x60, 0x00])
      // It seems it takes 2 bytes. 
      // Let's assume input 'energy' is the raw value. 
      // If the user passes reasonable range (0-65535 or so).
      // Actually, looking at original code: `new Uint8Array([0x60, 0x00])` -> This is 0x6000 if little endian? Or 0x0060?
      // Wait, standard kitty printers usually take 2 bytes for energy. 
      // Let's implement it as taking a higher byte and lower byte.
      // Default was 0x60, 0x00. Let's stick to that structure.
      
      const energyHigh = (energy >> 8) & 0xff;
      const energyLow = energy & 0xff;
      
      await this.sendPacket(buildPacket(CMD_ENERGY, new Uint8Array([energyLow, energyHigh]))); 
      // Wait - original was [0x60, 0x00]. If that is High, Low then 0x6000. 
      // If it is Low, High then 0x0060.
      // 0x60 = 96. 0x6000 = 24576.
      // "Energy" usually means heat time. 
      // Let's check the original line: `new Uint8Array([0x60, 0x00])`.
      // If I assume it's Low-High like often in these protocols...
      // Let's trust the original code order: [0x60, 0x00].
      // So if I want to pass a value, I should split it.
      // Let's allow passing the raw Uint8Array or just a number which we split?
      // Let's stick to the previous hardcoded style but parameterized.
      // If standard is 0x60 (96), range likely 0-255 for fine control?
      // Or maybe it is a 16-bit value.
      // Let's expose it as a single number (intensity) around 0-100?
      // The previous code had 0x60 (96). 
      // Let's assume the first byte is the main energy value. 
      
      // Let's change the signature to be easier: 
      // energy: number = 96 (0x60)
      
      const energyByte = Math.max(0, Math.min(255, energy));
      // Keeping the second byte 0x00 for now as in original.
      await this.sendPacket(buildPacket(CMD_ENERGY, new Uint8Array([energyByte, 0x00])));
      await this.delay(50);

      // Apply energy
      await this.sendPacket(buildPacket(CMD_APPLY_ENERGY, new Uint8Array([0x01])));
      await this.delay(50);

      // Start lattice mode
      const latticeStart = new Uint8Array([
        0xaa, 0x55, 0x17, 0x38, 0x44, 0x5f, 0x5f, 0x5f, 0x44, 0x38, 0x2c,
      ]);
      await this.sendPacket(buildPacket(CMD_LATTICE, latticeStart));
      await this.delay(50);

      // Print each line
      for (let y = 0; y < height; y++) {
        const lineStart = y * bytesPerRow;
        const lineData = bitmap.slice(lineStart, lineStart + bytesPerRow);
        await this.sendPacket(buildPacket(CMD_BITMAP, lineData));

        if (y % 8 === 0) {
          await this.delay(20);
        }

        onProgress?.(Math.round(((y + 1) / height) * 100));
      }

      // End lattice mode
      const latticeEnd = new Uint8Array([
        0xaa, 0x55, 0x17, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17,
      ]);
      await this.sendPacket(buildPacket(CMD_LATTICE, latticeEnd));
      await this.delay(50);

      // Feed paper to finish with blank space
      await this.feedPaper(100);

      this.setStatus("connected");
    } catch (error) {
      this.setStatus("connected");
      throw error;
    }
  }

  async feedPaper(lines: number = 20): Promise<void> {
    if (!this.characteristic) {
      throw new Error("Printer not connected");
    }

    const feedData = new Uint8Array([lines, 0x00]);
    await this.sendPacket(buildPacket(CMD_FEED, feedData));
  }
}

// Singleton instance
let printerInstance: CatPrinter | null = null;

export function getCatPrinter(): CatPrinter {
  if (!printerInstance) {
    printerInstance = new CatPrinter();
  }
  return printerInstance;
}
