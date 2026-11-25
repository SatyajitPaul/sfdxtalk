/**
 * Minimal ZIP writer (STORE method, no compression) for downloadable skill packs.
 * Skills are small text files, so skipping compression keeps this tiny and
 * deterministic: the same input always yields byte-identical output, with a fixed
 * timestamp, so a rebuild does not change the file.
 */

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();

export function crc32(data: Uint8Array): number {
	let c = 0xffffffff;
	for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
	/** Forward-slash path inside the archive, e.g. "my-skill/SKILL.md". */
	path: string;
	data: Uint8Array;
}

// DOS date/time for 1980-01-01 00:00:00 (the earliest value ZIP can store).
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1;

export function zipStore(entries: ZipEntry[]): Uint8Array {
	const enc = new TextEncoder();
	const chunks: Uint8Array[] = [];
	const central: Uint8Array[] = [];
	let offset = 0;

	const u16 = (v: number) => [v & 0xff, (v >>> 8) & 0xff];
	const u32 = (v: number) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];

	for (const entry of entries) {
		const name = enc.encode(entry.path);
		const crc = crc32(entry.data);
		const size = entry.data.length;
		// General purpose flag bit 11: file names are UTF-8.
		const common = [...u16(0x0800), ...u16(0), ...u16(DOS_TIME), ...u16(DOS_DATE), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0)];

		const local = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...u16(20), ...common, ...name]);
		chunks.push(local, entry.data);

		central.push(
			new Uint8Array([0x50, 0x4b, 0x01, 0x02, ...u16(20), ...u16(20), ...common, ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name]),
		);
		offset += local.length + size;
	}

	const centralSize = central.reduce((sum, c) => sum + c.length, 0);
	const end = new Uint8Array([0x50, 0x4b, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length), ...u32(centralSize), ...u32(offset), ...u16(0)]);

	const all = [...chunks, ...central, end];
	const out = new Uint8Array(all.reduce((sum, c) => sum + c.length, 0));
	let pos = 0;
	for (const chunk of all) {
		out.set(chunk, pos);
		pos += chunk.length;
	}
	return out;
}
