#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'artifacts', 'garden-2048', 'public');

const FILES = [
  'menu-mission.svg',
  'menu-card.svg',
  'menu-infinite.svg',
  'menu-shop.svg',
  'menu-settings.svg',
  'menu-subscribe.svg',
];

function fixSvg(content, filename) {
  // ----------------------------------------------------------------
  // Step 1: Find the <pattern ...> block and extract the <use> info
  // ----------------------------------------------------------------

  // Locate the opening <pattern tag
  const patternStart = content.indexOf('<pattern ');
  if (patternStart === -1) {
    throw new Error(`No <pattern> found in ${filename}`);
  }

  // Find the closing </pattern>
  const patternCloseTag = '</pattern>';
  const patternEnd = content.indexOf(patternCloseTag, patternStart);
  if (patternEnd === -1) {
    throw new Error(`No </pattern> found in ${filename}`);
  }

  const patternFull = content.substring(patternStart, patternEnd + patternCloseTag.length);

  // Extract the <use xlink:href="..." transform="..."/> inside the pattern
  const useStart = patternFull.indexOf('<use ');
  if (useStart === -1) {
    throw new Error(`No <use> inside <pattern> in ${filename}`);
  }
  const useEnd = patternFull.indexOf('/>', useStart);
  if (useEnd === -1) {
    throw new Error(`Unclosed <use> in pattern in ${filename}`);
  }
  const useTag = patternFull.substring(useStart, useEnd + 2); // includes '/>'

  // Extract xlink:href from use (it references #i_menu_CARD)
  const hrefAttr = 'xlink:href="';
  const hrefPos = useTag.indexOf(hrefAttr);
  if (hrefPos === -1) {
    throw new Error(`No xlink:href on <use> in ${filename}`);
  }
  const hrefValueStart = hrefPos + hrefAttr.length;
  const hrefValueEnd = useTag.indexOf('"', hrefValueStart);
  const useHrefValue = useTag.substring(hrefValueStart, hrefValueEnd); // e.g. "#i_menu_card"

  // Extract transform from use
  const transformAttr = 'transform="';
  const transformPos = useTag.indexOf(transformAttr);
  if (transformPos === -1) {
    throw new Error(`No transform on <use> in ${filename}`);
  }
  const transformValueStart = transformPos + transformAttr.length;
  const transformValueEnd = useTag.indexOf('"', transformValueStart);
  const useTransform = useTag.substring(transformValueStart, transformValueEnd);

  // ----------------------------------------------------------------
  // Step 2: Find the standalone <image id="i_menu_CARD" ...> in defs
  // ----------------------------------------------------------------

  // The id is the fragment from the use href (strip leading '#')
  const imageId = useHrefValue.startsWith('#') ? useHrefValue.slice(1) : useHrefValue;

  // Locate the image tag by its id
  const imageIdAttr = `id="${imageId}"`;
  const imageTagStart = content.indexOf(`<image ${imageIdAttr}`);
  // Also try attribute in a different order (id might not be first)
  let imageStart = imageTagStart;
  if (imageStart === -1) {
    // Try searching any <image that contains id="..."
    let searchFrom = 0;
    while (searchFrom < content.length) {
      const candidate = content.indexOf('<image ', searchFrom);
      if (candidate === -1) break;
      const candidateEnd = content.indexOf('/>', candidate);
      if (candidateEnd === -1) break;
      const candidateTag = content.substring(candidate, candidateEnd + 2);
      if (candidateTag.indexOf(imageIdAttr) !== -1) {
        imageStart = candidate;
        break;
      }
      searchFrom = candidate + 1;
    }
  }
  if (imageStart === -1) {
    throw new Error(`Standalone <image id="${imageId}"> not found in ${filename}`);
  }

  const imageEnd = content.indexOf('/>', imageStart);
  if (imageEnd === -1) {
    throw new Error(`Unclosed standalone <image> in ${filename}`);
  }
  const imageTag = content.substring(imageStart, imageEnd + 2);

  // Extract width, height, preserveAspectRatio from the image tag
  function extractAttr(tag, attr) {
    const marker = `${attr}="`;
    const pos = tag.indexOf(marker);
    if (pos === -1) return null;
    const start = pos + marker.length;
    const end = tag.indexOf('"', start);
    return tag.substring(start, end);
  }

  const imgWidth = extractAttr(imageTag, 'width');
  const imgHeight = extractAttr(imageTag, 'height');
  const imgPreserve = extractAttr(imageTag, 'preserveAspectRatio');

  // Extract xlink:href data from image (the base64 data URI)
  const imgXlinkHref = extractAttr(imageTag, 'xlink:href');
  if (!imgXlinkHref) {
    throw new Error(`No xlink:href on standalone <image> in ${filename}`);
  }

  // ----------------------------------------------------------------
  // Step 3: Build the new pattern block (image embedded, no <use>)
  // ----------------------------------------------------------------

  // Extract the pattern opening tag (everything up to first '>')
  const patternOpenEnd = patternFull.indexOf('>');
  const patternOpenTag = patternFull.substring(0, patternOpenEnd + 1);

  const newImageTag = `<image width="${imgWidth}" height="${imgHeight}" preserveAspectRatio="${imgPreserve}" href="${imgXlinkHref}" transform="${useTransform}"/>`;
  const newPattern = `${patternOpenTag}\n    ${newImageTag}\n  ${patternCloseTag}`;

  // ----------------------------------------------------------------
  // Step 4: Splice everything back together
  // ----------------------------------------------------------------

  // Replace the old pattern block with the new one
  let result = content.substring(0, patternStart) + newPattern + content.substring(patternEnd + patternCloseTag.length);

  // Remove the standalone <image id="..."> from defs
  // Recalculate position because we just changed earlier content
  // The image tag is AFTER the pattern in the original, so its offset may shift.
  // Re-search in the updated result.
  const newImageStart = result.indexOf(`<image ${imageIdAttr}`);
  let foundImageStart = newImageStart;
  if (foundImageStart === -1) {
    // Try alt search
    let searchFrom = 0;
    while (searchFrom < result.length) {
      const candidate = result.indexOf('<image ', searchFrom);
      if (candidate === -1) break;
      const candidateEnd = result.indexOf('/>', candidate);
      if (candidateEnd === -1) break;
      const candidateTag = result.substring(candidate, candidateEnd + 2);
      if (candidateTag.indexOf(imageIdAttr) !== -1) {
        foundImageStart = candidate;
        break;
      }
      searchFrom = candidate + 1;
    }
  }

  if (foundImageStart === -1) {
    throw new Error(`Could not find standalone <image id="${imageId}"> to remove after pattern replacement in ${filename}`);
  }

  const foundImageEnd = result.indexOf('/>', foundImageStart);
  // Also consume an optional trailing newline after the tag
  let afterTag = foundImageEnd + 2;
  if (result[afterTag] === '\n') afterTag++;

  result = result.substring(0, foundImageStart) + result.substring(afterTag);

  // ----------------------------------------------------------------
  // Step 5: Remove xmlns:xlink from <svg> root if no longer used
  // ----------------------------------------------------------------
  // Check if xlink: still appears anywhere (other than in the svg namespace decl itself)
  // We'll strip the xmlns:xlink declaration from the svg opening tag
  const xmlnsXlink = ' xmlns:xlink="http://www.w3.org/1999/xlink"';
  const stillUsesXlink = result.indexOf('xlink:') !== -1;
  if (!stillUsesXlink) {
    result = result.replace(xmlnsXlink, '');
  }

  return result;
}

let allOk = true;

for (const file of FILES) {
  const filePath = path.join(PUBLIC_DIR, file);
  console.log(`\nProcessing: ${file}`);

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.error(`  ERROR reading file: ${e.message}`);
    allOk = false;
    continue;
  }

  let fixed;
  try {
    fixed = fixSvg(content, file);
  } catch (e) {
    console.error(`  ERROR fixing: ${e.message}`);
    allOk = false;
    continue;
  }

  // Verify the fix looks sane before writing
  if (fixed.indexOf('<use ') !== -1) {
    console.error(`  ERROR: <use> still present after fix in ${file}`);
    allOk = false;
    continue;
  }
  if (fixed.indexOf('xlink:href="data:') !== -1) {
    console.error(`  ERROR: xlink:href data URI still present after fix in ${file}`);
    allOk = false;
    continue;
  }
  if (fixed.indexOf('href="data:') === -1) {
    console.error(`  ERROR: modern href="data:" not found in fixed output for ${file}`);
    allOk = false;
    continue;
  }

  try {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`  OK — written (${fixed.length} bytes)`);
  } catch (e) {
    console.error(`  ERROR writing file: ${e.message}`);
    allOk = false;
  }
}

console.log('\n' + (allOk ? 'All files fixed successfully.' : 'Some files had errors — see above.'));
process.exit(allOk ? 0 : 1);
