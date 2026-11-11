/**
 * Build-time Open Graph image for each article (docs/PLAN.md §7):
 * 1200×630 PNG at /og/{category}/{slug}.png, same look as public/og-default.png.
 *
 * Drawn as SVG and rasterised by sharp. The build runs on macOS and on Linux
 * CI, which have different fonts, so nothing here depends on exact glyph
 * widths: text is wrapped from a pessimistic width estimate, the layout keeps
 * wide margins, and the pill text is centred in a fixed-size box.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import type { Doc } from './docs';
import { SITE } from './site';
import { CATEGORIES } from './taxonomy';

export const OG_WIDTH = SITE.ogImage.width;
export const OG_HEIGHT = SITE.ogImage.height;

/** Root-relative URL of an article's share image, e.g. /og/apex/trigger-handler-pattern.png */
export const docOgImagePath = (doc: Pick<Doc, 'id'>): string => `/og/${doc.id}.png`;

/** Alt text for an article's share image. */
export const docOgImageAlt = (doc: Pick<Doc, 'data'>): string =>
	`${doc.data.title} — ${SITE.name}, unofficial Salesforce developer documentation`;

export interface OgCard {
	title: string;
	category: string;
	/** Release and API version line, e.g. "Winter '27 · API 68.0". */
	meta: string;
}

const BG = '#181c20';
const TEXT = '#ece9e2';
const MUTED = '#a3a8ad';
const TEAL = '#6fb7a8';
const FONT = "Helvetica Neue, Helvetica, Arial, Liberation Sans, DejaVu Sans, sans-serif";

const MARGIN = 80;
const LOGO = { x: MARGIN, y: 56, size: 88 };
const TEXT_WIDTH = OG_WIDTH - MARGIN * 2;
const MAX_LINES = 3;
/** Title sizes to try, largest first; the first that fits in MAX_LINES wins. */
const TITLE_SIZES = [84, 72, 64, 56];
/** Vertical band between header and footer that holds category label + title. */
const BAND = { top: 178, bottom: 516 };
/** Category label height plus the gap under it. */
const LABEL = 60;
const lineHeightFor = (size: number): number => Math.round(size * 1.14);
const blockHeight = (size: number, lines: number): number => LABEL + lineHeightFor(size) * lines;

const esc = (s: string): string =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/**
 * Estimated width of bold text in em. Deliberately generous (close to DejaVu
 * Sans Bold, the widest font in the stack) so a line never overflows.
 */
function widthEm(text: string): number {
	let em = 0;
	for (const ch of text) {
		if (/[ilj.,:;'!|]/.test(ch)) em += 0.38;
		else if (/[ ftrI()\-/]/.test(ch)) em += 0.46;
		else if (/[mwMW@]/.test(ch)) em += 1.02;
		else if (/[A-Z0-9&]/.test(ch)) em += 0.78;
		else em += 0.68;
	}
	return em;
}

/** Greedy word wrap to a maximum line width in em. A single long word gets its own line. */
function wrap(text: string, maxEm: number): string[] {
	const lines: string[] = [];
	let line = '';
	for (const word of text.trim().split(/\s+/)) {
		const next = line ? `${line} ${word}` : word;
		if (line && widthEm(next) > maxEm) {
			lines.push(line);
			line = word;
		} else {
			line = next;
		}
	}
	if (line) lines.push(line);
	return lines;
}

/** Picks the largest title size that fits; over-long titles are cut with an ellipsis. */
function fitTitle(title: string): { size: number; lines: string[] } {
	let size = TITLE_SIZES[0];
	let lines: string[] = [];
	for (size of TITLE_SIZES) {
		lines = wrap(title, TEXT_WIDTH / size);
		const fits =
			lines.length <= MAX_LINES &&
			blockHeight(size, lines.length) <= BAND.bottom - BAND.top &&
			lines.every((l) => widthEm(l) * size <= TEXT_WIDTH);
		if (fits) return { size, lines };
	}
	// Smallest size and still too much text (not reachable with schema-valid titles).
	const maxEm = TEXT_WIDTH / size;
	lines = lines.slice(0, MAX_LINES).map((l) => {
		while (widthEm(l) > maxEm - 1) l = l.slice(0, -1);
		return l;
	});
	lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[\s.,:;]+$/, '')}…`;
	return { size, lines };
}

/** The card as SVG, without the logo (composited as a bitmap in `renderOgImage`). */
export function ogSvg(card: OgCard): string {
	const { size, lines } = fitTitle(card.title);
	const lineHeight = lineHeightFor(size);
	// Label + title are vertically centred in the band between header and footer.
	const y0 = BAND.top + Math.max(0, (BAND.bottom - BAND.top - blockHeight(size, lines.length)) / 2);
	const firstBaseline = y0 + LABEL + size * 0.8;
	const brandX = LOGO.x + LOGO.size + 24;
	const brandMid = LOGO.y + LOGO.size / 2;
	const pill = { w: 196, h: 48 };

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" font-family="${FONT}">
<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${BG}"/>
<text x="${brandX}" y="${brandMid + 15}" font-size="42" font-weight="700" fill="${TEXT}">${esc(SITE.name)}</text>
<rect x="${OG_WIDTH - MARGIN - pill.w}" y="${brandMid - pill.h / 2}" width="${pill.w}" height="${pill.h}" rx="${pill.h / 2}" fill="#1f2b2b" stroke="${TEAL}" stroke-width="2"/>
<text x="${OG_WIDTH - MARGIN - pill.w / 2}" y="${brandMid + 8}" font-size="22" font-weight="700" fill="${TEAL}" text-anchor="middle">UNOFFICIAL</text>
<text x="${MARGIN}" y="${y0 + 28}" font-size="30" font-weight="700" fill="${TEAL}">${esc(card.category)}</text>
${lines.map((l, i) => `<text x="${MARGIN}" y="${Math.round(firstBaseline + i * lineHeight)}" font-size="${size}" font-weight="700" fill="${TEXT}">${esc(l)}</text>`).join('\n')}
<text x="${MARGIN}" y="566" font-size="30" fill="${MUTED}">${esc(card.meta)}</text>
<text x="${OG_WIDTH - MARGIN}" y="566" font-size="26" fill="${MUTED}" text-anchor="end">Not affiliated with Salesforce</text>
<rect y="${OG_HEIGHT - 12}" width="${OG_WIDTH}" height="12" fill="${TEAL}"/>
</svg>`;
}

let logo: Promise<Buffer> | undefined;

/** The site logo scaled for the card header; read once per build. */
function logoBitmap(): Promise<Buffer> {
	// Resolved from the project root: this module is bundled, so import.meta.url moves.
	logo ??= readFile(join(process.cwd(), 'src/assets/logo.png')).then((file) =>
		sharp(file).resize(LOGO.size, LOGO.size).png().toBuffer(),
	);
	return logo;
}

/** Renders a card to a palette PNG (small file: flat colours plus a tiny logo). */
export async function renderOgImage(card: OgCard): Promise<Buffer> {
	return sharp(Buffer.from(ogSvg(card)))
		.composite([{ input: await logoBitmap(), left: LOGO.x, top: LOGO.y }])
		.png({ palette: true, colours: 128, effort: 10, compressionLevel: 9 })
		.toBuffer();
}

/** Share image for one article. */
export function docOgImage(doc: Doc): Promise<Buffer> {
	const d = doc.data;
	return renderOgImage({
		title: d.title,
		category: CATEGORIES[d.category].label,
		meta: `${d.release} · API ${d.apiVersion}`,
	});
}
